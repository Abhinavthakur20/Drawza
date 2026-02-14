import { useEffect, useMemo, useRef, useState } from "react";

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getBounds(element) {
  if (element.type === "text") {
    return {
      x: element.x,
      y: element.y,
      width: element.width || 0,
      height: element.height || (element.fontSize || 24),
    };
  }

  if (element.type === "pencil") {
    const xs = element.points.map((p) => p.x);
    const ys = element.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  return {
    x: Math.min(element.x, element.x + element.width),
    y: Math.min(element.y, element.y + element.height),
    width: Math.abs(element.width),
    height: Math.abs(element.height),
  };
}

function hitTest(elements, point) {
  for (let i = elements.length - 1; i >= 0; i -= 1) {
    const el = elements[i];
    const b = getBounds(el);
    if (
      point.x >= b.x - 6 &&
      point.x <= b.x + b.width + 6 &&
      point.y >= b.y - 6 &&
      point.y <= b.y + b.height + 6
    ) {
      return el;
    }
  }
  return null;
}

function drawElement(ctx, element) {
  ctx.strokeStyle = element.strokeColor || "#111";
  ctx.lineWidth = element.strokeWidth || 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = Math.max(0, Math.min(1, (element.opacity ?? 100) / 100));

  if (element.type === "rectangle") {
    if (element.fillColor && element.fillColor !== "transparent") {
      ctx.fillStyle = element.fillColor;
      ctx.fillRect(element.x, element.y, element.width, element.height);
    }
    ctx.strokeRect(element.x, element.y, element.width, element.height);
  } else if (element.type === "line") {
    ctx.beginPath();
    ctx.moveTo(element.x, element.y);
    ctx.lineTo(element.x + element.width, element.y + element.height);
    ctx.stroke();
  } else if (element.type === "pencil") {
    const points = element.points || [];
    if (points.length < 2) {
      return;
    }
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  } else if (element.type === "text") {
    const fontSize = element.fontSize || 24;
    ctx.font = `${fontSize}px Manrope, sans-serif`;
    ctx.fillStyle = element.strokeColor || "#111";
    ctx.textBaseline = "top";
    const lines = String(element.text || "").split("\n");
    const lineHeight = fontSize * 1.2;
    lines.forEach((line, index) => {
      ctx.fillText(line, element.x, element.y + index * lineHeight);
    });
  }

  ctx.globalAlpha = 1;
}

function drawGrid(ctx, width, height, zoom, panOffset) {
  const worldSize = 24;
  const spacing = Math.max(worldSize * zoom, 8);
  const startX = ((panOffset.x % spacing) + spacing) % spacing;
  const startY = ((panOffset.y % spacing) + spacing) % spacing;

  ctx.fillStyle = "#f7f7f8";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = startX; x < width; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }

  for (let y = startY; y < height; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }

  ctx.stroke();
}

function estimateTextBounds(text, fontSize) {
  const lines = String(text || "").split("\n");
  const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
  return {
    width: Math.max(1, longestLine * fontSize * 0.6),
    height: Math.max(fontSize * 1.2, lines.length * fontSize * 1.2),
  };
}

function isTypingElement(target) {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function toWorld(e, canvas, zoom, panOffset) {
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  return {
    x: (screenX - panOffset.x) / zoom,
    y: (screenY - panOffset.y) / zoom,
  };
}

function createNewElement({ tool, x, y, color, fillColor, width, opacity, createdBy }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: tool,
    x,
    y,
    width: 0,
    height: 0,
    points: tool === "pencil" ? [{ x, y }] : [],
    strokeColor: color,
    fillColor,
    strokeWidth: width,
    opacity,
    createdBy,
    createdAt: new Date().toISOString(),
  };
}

function createTextElement({ x, y, text, color, opacity, createdBy }) {
  const fontSize = 24;
  const bounds = estimateTextBounds(text, fontSize);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "text",
    x,
    y,
    width: bounds.width,
    height: bounds.height,
    text,
    fontSize,
    points: [],
    strokeColor: color,
    fillColor: "transparent",
    strokeWidth: 1,
    opacity,
    createdBy,
    createdAt: new Date().toISOString(),
  };
}

export default function Canvas({
  elements,
  selectedIds,
  tool,
  zoom,
  panOffset,
  strokeColor,
  fillColor,
  strokeWidth,
  opacity,
  cursors,
  userId,
  setPanOffset,
  setZoom,
  setSelectedIds,
  onCreate,
  onUpdate,
  onCursorMove,
}) {
  const canvasRef = useRef(null);
  const textInputRef = useRef(null);
  const pixelRatioRef = useRef(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
  const viewportRef = useRef({ width: 0, height: 0 });
  const wasEditingRef = useRef(false);
  const [draft, setDraft] = useState(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [editingText, setEditingText] = useState(null);
  const interactionRef = useRef({ mode: "none", start: null, elementStart: null });

  const selectedElement = useMemo(
    () => elements.find((el) => selectedIds.includes(el.id)) || null,
    [elements, selectedIds]
  );

  useEffect(() => {
    if (editingText && !wasEditingRef.current) {
      const frame = requestAnimationFrame(() => {
        const input = textInputRef.current;
        if (!input) {
          return;
        }
        input.focus();
        const end = input.value.length;
        input.setSelectionRange(end, end);
      });
      wasEditingRef.current = true;
      return () => cancelAnimationFrame(frame);
    }

    if (!editingText) {
      wasEditingRef.current = false;
    }

    return undefined;
  }, [editingText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      pixelRatioRef.current = dpr;
      viewportRef.current = { width: canvas.clientWidth, height: canvas.clientHeight };
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    let raf;

    const render = () => {
      const dpr = pixelRatioRef.current;
      const { width, height } = viewportRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      drawGrid(ctx, width, height, zoom, panOffset);

      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);

      for (const el of elements) {
        drawElement(ctx, el);
      }

      if (draft) {
        drawElement(ctx, draft);
      }

      if (selectedElement) {
        const b = getBounds(selectedElement);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "#175cd3";
        ctx.lineWidth = 1 / zoom;
        ctx.strokeRect(b.x - 4 / zoom, b.y - 4 / zoom, b.width + 8 / zoom, b.height + 8 / zoom);
        ctx.setLineDash([]);
        ctx.fillStyle = "#175cd3";
        ctx.fillRect(b.x + b.width - 4 / zoom, b.y + b.height - 4 / zoom, 8 / zoom, 8 / zoom);
      }

      Object.entries(cursors).forEach(([id, cursor]) => {
        if (!cursor || id === userId) {
          return;
        }

        const worldX = (cursor.x - panOffset.x) / zoom;
        const worldY = (cursor.y - panOffset.y) / zoom;

        ctx.fillStyle = "#d92d20";
        ctx.beginPath();
        ctx.arc(worldX, worldY, 3 / zoom, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [elements, draft, selectedElement, zoom, panOffset, cursors, userId]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingElement(e.target)) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const onKeyUp = (e) => {
      if (isTypingElement(e.target)) {
        return;
      }

      if (e.code === "Space") {
        setSpacePressed(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const onPointerDown = (e) => {
    if (editingText) {
      return;
    }

    const canvas = canvasRef.current;
    const point = toWorld(e, canvas, zoom, panOffset);

    if (tool === "text") {
      e.preventDefault();
      e.stopPropagation();
      const hit = hitTest(elements, point);
      if (hit?.type === "text") {
        setEditingText({
          elementId: hit.id,
          x: hit.x,
          y: hit.y,
          fontSize: hit.fontSize || 24,
          text: hit.text || "",
        });
        setSelectedIds([hit.id]);
      } else {
        setEditingText({
          elementId: null,
          x: point.x,
          y: point.y,
          fontSize: 24,
          text: "",
        });
        setSelectedIds([]);
      }
      interactionRef.current = { mode: "none", start: null, elementStart: null };
      requestAnimationFrame(() => {
        textInputRef.current?.focus();
      });
      return;
    }

    if (tool === "pan" || e.button === 1 || spacePressed) {
      interactionRef.current = {
        mode: "pan",
        start: { x: e.clientX, y: e.clientY, panStart: panOffset },
      };
      return;
    }

    if (tool === "select") {
      const hit = hitTest(elements, point);
      if (!hit) {
        setSelectedIds([]);
        interactionRef.current = { mode: "none" };
        return;
      }

      if (hit.type === "text" && e.detail >= 2) {
        setEditingText({
          elementId: hit.id,
          x: hit.x,
          y: hit.y,
          fontSize: hit.fontSize || 24,
          text: hit.text || "",
        });
        setSelectedIds([hit.id]);
        interactionRef.current = { mode: "none", start: null, elementStart: null };
        return;
      }

      const b = getBounds(hit);
      const handle = { x: b.x + b.width, y: b.y + b.height };
      const resizing = distance(point, handle) < 10 / zoom;
      setSelectedIds([hit.id]);

      interactionRef.current = {
        mode: resizing ? "resize" : "move",
        start: point,
        elementStart: { ...hit },
      };
      return;
    }

    const next = createNewElement({
      tool,
      x: point.x,
      y: point.y,
      color: strokeColor,
      fillColor,
      width: strokeWidth,
      opacity,
      createdBy: userId,
    });

    setDraft(next);
    interactionRef.current = { mode: "draw", start: point };
  };

  const onPointerMoveHandler = (e) => {
    const canvas = canvasRef.current;
    const point = toWorld(e, canvas, zoom, panOffset);

    onCursorMove?.({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });

    if (interactionRef.current.mode === "none") {
      return;
    }

    if (interactionRef.current.mode === "pan") {
      const { start } = interactionRef.current;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      setPanOffset({ x: start.panStart.x + dx, y: start.panStart.y + dy });
      return;
    }

    if (interactionRef.current.mode === "draw" && draft) {
      if (draft.type === "pencil") {
        setDraft((prev) => ({
          ...prev,
          points: [...prev.points, point],
          width: point.x - prev.x,
          height: point.y - prev.y,
        }));
      } else {
        setDraft((prev) => ({
          ...prev,
          width: point.x - prev.x,
          height: point.y - prev.y,
        }));
      }
      return;
    }

    if (interactionRef.current.mode === "move") {
      const { start, elementStart } = interactionRef.current;
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      onUpdate({ ...elementStart, x: elementStart.x + dx, y: elementStart.y + dy }, true);
      return;
    }

    if (interactionRef.current.mode === "resize") {
      const { elementStart } = interactionRef.current;
      onUpdate(
        {
          ...elementStart,
          width: point.x - elementStart.x,
          height: point.y - elementStart.y,
        },
        true
      );
    }
  };

  const onPointerUpHandler = () => {
    if (interactionRef.current.mode === "draw" && draft) {
      onCreate(draft);
      setSelectedIds([draft.id]);
      setDraft(null);
    }

    interactionRef.current = { mode: "none", start: null, elementStart: null };
  };

  const onWheelHandler = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const pointerX = e.clientX - rect.left;
      const pointerY = e.clientY - rect.top;
      const worldX = (pointerX - panOffset.x) / zoom;
      const worldY = (pointerY - panOffset.y) / zoom;

      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const nextZoom = Math.max(0.2, Math.min(4, zoom * factor));

      setZoom(nextZoom);
      setPanOffset({
        x: pointerX - worldX * nextZoom,
        y: pointerY - worldY * nextZoom,
      });
      return;
    }

    e.preventDefault();
    setPanOffset({
      x: panOffset.x - e.deltaX,
      y: panOffset.y - e.deltaY,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const handleWheel = (event) => {
      onWheelHandler(event);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [zoom, panOffset, setZoom, setPanOffset]);

  const scrollToContent = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (!elements.length) {
      setPanOffset({ x: 0, y: 0 });
      return;
    }

    const bounds = elements.map(getBounds);
    const minX = Math.min(...bounds.map((b) => b.x));
    const minY = Math.min(...bounds.map((b) => b.y));
    const maxX = Math.max(...bounds.map((b) => b.x + b.width));
    const maxY = Math.max(...bounds.map((b) => b.y + b.height));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const { width, height } = viewportRef.current;
    setPanOffset({
      x: width / 2 - centerX * zoom,
      y: height / 2 - centerY * zoom,
    });
  };

  const commitTextEdit = (shouldSave = true) => {
    if (!editingText) {
      return;
    }

    const rawText = editingText.text || "";
    const text = rawText.trim();

    if (!shouldSave) {
      setEditingText(null);
      return;
    }

    if (!editingText.elementId) {
      if (!text) {
        setEditingText(null);
        return;
      }

      const created = createTextElement({
        x: editingText.x,
        y: editingText.y,
        text: rawText,
        color: strokeColor,
        opacity,
        createdBy: userId,
      });
      onCreate(created);
      setSelectedIds([created.id]);
      setEditingText(null);
      return;
    }

    const original = elements.find((el) => el.id === editingText.elementId);
    if (!original) {
      setEditingText(null);
      return;
    }

    if (!text) {
      onUpdate({
        ...original,
        text: "",
        width: 1,
        height: (original.fontSize || 24) * 1.2,
      });
      setEditingText(null);
      return;
    }

    const nextBounds = estimateTextBounds(rawText, original.fontSize || 24);
    onUpdate({
      ...original,
      text: rawText,
      width: nextBounds.width,
      height: nextBounds.height,
    });
    setEditingText(null);
  };

  const handleTextKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      commitTextEdit(false);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitTextEdit(true);
    }
  };

  const editorLeft = editingText ? panOffset.x + editingText.x * zoom : 0;
  const editorTop = editingText ? panOffset.y + editingText.y * zoom : 0;
  const editorBounds = editingText ? estimateTextBounds(editingText.text, editingText.fontSize) : { width: 140, height: 28 };
  const editorWidth = Math.max(140, editorBounds.width + 24) * zoom;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f7f7f8]">
      <canvas
        className="block h-full w-full"
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMoveHandler}
        onPointerUp={onPointerUpHandler}
        onPointerLeave={onPointerUpHandler}
      />
      {editingText && (
        <textarea
          ref={textInputRef}
          autoFocus
          value={editingText.text}
          onChange={(e) => setEditingText((prev) => ({ ...prev, text: e.target.value }))}
          onBlur={() => commitTextEdit(true)}
          onKeyDown={handleTextKeyDown}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute z-40 resize-none overflow-hidden rounded border-2 border-indigo-400 bg-white p-1 text-slate-900 outline-none"
          placeholder="Type text..."
          style={{
            left: `${editorLeft}px`,
            top: `${editorTop}px`,
            width: `${editorWidth}px`,
            minHeight: `${(editingText.fontSize || 24) * 1.4 * zoom}px`,
            fontSize: `${(editingText.fontSize || 24) * zoom}px`,
            fontFamily: "Manrope, sans-serif",
            lineHeight: 1.2,
          }}
        />
      )}
      <button
        className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs text-slate-700 shadow-sm"
        onClick={scrollToContent}
      >
        Scroll back to content
      </button>
    </div>
  );
}
