const TOOL_ITEMS = [
  { id: "select", label: "Pointer", icon: "ri-cursor-line" },
  { id: "text", label: "Text", icon: "ri-text" },
  { id: "rectangle", label: "Rectangle", icon: "ri-checkbox-blank-line" },
  { id: "line", label: "Line", icon: "ri-subtract-line" },
  { id: "pencil", label: "Draw", icon: "ri-pencil-line" },
  { id: "pan", label: "Hand", icon: "ri-hand" },
];

const STROKE_COLORS = ["#1f2937", "#ef4444", "#16a34a", "#2563eb", "#f59e0b", "#111111"];
const FILL_COLORS = ["transparent", "#fecaca", "#bbf7d0", "#bfdbfe", "#fde68a"];
const WIDTHS = [1, 2, 4];

function formatRoomCode(roomId) {
  if (!roomId) {
    return "";
  }
  if (roomId.length <= 22) {
    return roomId;
  }
  return `${roomId.slice(0, 12)}...${roomId.slice(-6)}`;
}

function getInitials(name) {
  if (!name) {
    return "U";
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export default function Toolbar({
  roomId,
  userName,
  userAvatar,
  tool,
  setTool,
  strokeColor,
  setStrokeColor,
  fillColor,
  setFillColor,
  strokeWidth,
  setStrokeWidth,
  opacity,
  setOpacity,
  selectedElement,
  onStyleChange,
  onDeleteSelected,
  onDuplicateSelected,
  zoom,
  setZoom,
  setPanOffset,
  onUndo,
  onRedo,
  onClearAll,
  hasElements,
  onlineCount,
  onShareRoomCode,
  onLogout,
}) {
  const showStylePanel = tool !== "select" || !!selectedElement;

  const applyStyle = (patch) => {
    onStyleChange?.(patch);
  };

  const onPickStroke = (color) => {
    setStrokeColor(color);
    applyStyle({ strokeColor: color });
  };

  const onPickFill = (color) => {
    setFillColor(color);
    applyStyle({ fillColor: color });
  };

  const onPickWidth = (width) => {
    setStrokeWidth(width);
    applyStyle({ strokeWidth: width });
  };

  const onOpacityChange = (value) => {
    const next = Number(value);
    setOpacity(next);
    applyStyle({ opacity: next });
  };

  return (
    <>
      <div className="pointer-events-none absolute left-4 right-4 top-4 z-30 hidden items-start gap-3 md:flex">
        <div className="pointer-events-auto flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
          {userAvatar ? (
            <img src={userAvatar} alt={userName || "User"} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
              {getInitials(userName)}
            </div>
          )}
          <span className="max-w-[110px] truncate text-xs text-slate-700">{userName || "Guest"}</span>
        </div>

        <div className="min-w-0 flex-1 px-1">
          <div className="pointer-events-auto mx-auto flex w-fit max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 px-2 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur">
            {TOOL_ITEMS.map((item) => (
              <button
                key={item.id}
                title={item.label}
                aria-label={item.label}
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                  tool === item.id
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => setTool(item.id)}
              >
                <i className={`${item.icon} text-[15px] leading-none`} />
              </button>
            ))}

            <div className="mx-1 h-6 w-px bg-slate-200" />

            <input
              type="color"
              className="h-8 w-10 cursor-pointer rounded-lg border border-slate-300 bg-white px-1"
              value={strokeColor}
              onChange={(e) => onPickStroke(e.target.value)}
            />

            <select
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
              value={strokeWidth}
              onChange={(e) => onPickWidth(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
            </select>

            <button className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" onClick={onUndo}>
              Undo
            </button>
            <button className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs" onClick={onRedo}>
              Redo
            </button>
            <button
              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={onClearAll}
              disabled={!hasElements}
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <span
            title={roomId}
            className="hidden max-w-[150px] truncate rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm xl:inline-flex"
          >
            {formatRoomCode(roomId)}
          </span>
          <button
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm"
            onClick={onShareRoomCode}
          >
            Share code
          </button>
          <span className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm lg:inline-flex">
            Online: {onlineCount}
          </span>
          <span className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm md:inline-flex">
            {userName || "Guest"}
          </span>
          <button className="rounded-xl bg-[#635bff] px-3 py-2 text-xs text-white shadow-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute left-3 top-4 z-30 flex md:hidden">
        <div className="pointer-events-auto flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
            {getInitials(userName)}
          </div>

          <div className="h-px w-7 bg-slate-200" />

          {TOOL_ITEMS.map((item) => (
            <button
              key={`mobile-${item.id}`}
              title={item.label}
              aria-label={item.label}
              className={`rounded-lg border px-2.5 py-2 text-xs ${
                tool === item.id
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => setTool(item.id)}
            >
              <i className={`${item.icon} text-[15px] leading-none`} />
            </button>
          ))}

          <div className="h-px w-7 bg-slate-200" />

          <input
            type="color"
            className="h-8 w-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-1"
            value={strokeColor}
            onChange={(e) => onPickStroke(e.target.value)}
          />

          <select
            className="w-9 rounded-lg border border-slate-300 bg-white px-1 py-1.5 text-[10px]"
            value={strokeWidth}
            onChange={(e) => onPickWidth(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={6}>6</option>
          </select>

          <button
            title="Undo"
            aria-label="Undo"
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700"
            onClick={onUndo}
          >
            <i className="ri-arrow-go-back-line text-[14px]" />
          </button>
          <button
            title="Redo"
            aria-label="Redo"
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700"
            onClick={onRedo}
          >
            <i className="ri-arrow-go-forward-line text-[14px]" />
          </button>

          <button
            title="Clear all"
            aria-label="Clear all"
            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClearAll}
            disabled={!hasElements}
          >
            <i className="ri-delete-bin-6-line text-[14px]" />
          </button>

          <button
            title={roomId}
            className="max-w-[110px] truncate rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[10px] text-slate-600"
            onClick={onShareRoomCode}
          >
            Share
          </button>

          <button className="rounded-lg bg-[#635bff] px-2 py-1.5 text-[10px] text-white" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-30">
        <div className="pointer-events-auto hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs shadow-sm md:flex">
          <button className="rounded-md bg-slate-100 px-2 py-1" onClick={() => setZoom(zoom - 0.1)}>
            -
          </button>
          <span className="min-w-11 text-center">{Math.round(zoom * 100)}%</span>
          <button className="rounded-md bg-slate-100 px-2 py-1" onClick={() => setZoom(zoom + 0.1)}>
            +
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 right-3 z-30 md:hidden">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-2.5 py-2 text-xs shadow-sm backdrop-blur">
          <button className="rounded-md bg-slate-100 px-3 py-1.5 text-sm" onClick={() => setZoom(zoom - 0.1)}>
            -
          </button>
          <span className="min-w-12 text-center text-xs font-medium">{Math.round(zoom * 100)}%</span>
          <button className="rounded-md bg-slate-100 px-3 py-1.5 text-sm" onClick={() => setZoom(zoom + 0.1)}>
            +
          </button>
        </div>
      </div>

      {showStylePanel && (
        <div className="pointer-events-none absolute left-4 top-20 z-30 hidden w-[210px] md:block">
          <div className="pointer-events-auto rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-700 shadow-sm backdrop-blur">
            <div className="mb-2">Stroke</div>
            <div className="mb-4 flex flex-wrap gap-2">
              {STROKE_COLORS.map((color) => (
                <button
                  key={color}
                  className={`h-6 w-6 rounded-md border ${
                    strokeColor === color ? "border-indigo-500 ring-1 ring-indigo-300" : "border-slate-300"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => onPickStroke(color)}
                />
              ))}
            </div>

            <div className="mb-2">Background</div>
            <div className="mb-4 flex flex-wrap gap-2">
              {FILL_COLORS.map((color) => (
                <button
                  key={color}
                  className={`h-6 w-6 rounded-md border ${
                    fillColor === color ? "border-indigo-500 ring-1 ring-indigo-300" : "border-slate-300"
                  }`}
                  style={{
                    backgroundColor: color === "transparent" ? "#ffffff" : color,
                    backgroundImage:
                      color === "transparent"
                        ? "linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%,#e5e7eb)"
                        : "none",
                    backgroundSize: color === "transparent" ? "10px 10px" : "auto",
                    backgroundPosition: color === "transparent" ? "0 0,5px 5px" : "initial",
                  }}
                  onClick={() => onPickFill(color)}
                />
              ))}
            </div>

            <div className="mb-2">Stroke width</div>
            <div className="mb-4 flex gap-2">
              {WIDTHS.map((width) => (
                <button
                  key={width}
                  className={`rounded-lg px-3 py-1.5 ${
                    strokeWidth === width ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"
                  }`}
                  onClick={() => onPickWidth(width)}
                >
                  {width}
                </button>
              ))}
            </div>

            <div className="mb-2">Opacity</div>
            <input
              className="mb-1 w-full accent-indigo-500"
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => onOpacityChange(e.target.value)}
            />
            <div className="mb-4 flex justify-between text-[11px] text-slate-500">
              <span>0</span>
              <span>{opacity}</span>
            </div>

            <div className="mb-2">Actions</div>
            <div className="flex gap-2">
              <button
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!selectedElement}
                onClick={onDuplicateSelected}
              >
                Duplicate
              </button>
              <button
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!selectedElement}
                onClick={onDeleteSelected}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
