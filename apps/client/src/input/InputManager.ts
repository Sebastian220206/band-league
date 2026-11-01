/**
 * Unified Input Manager for Band League.
 * Supports multi-touch on mobile and low-latency keyboard controls on desktop/laptop.
 */

export interface InputEventCallback {
  (lane: number, timestampMs: number): void;
}

export interface InputReleaseCallback {
  (lane: number): void;
}

export class InputManager {
  private onLaneDownCb?: InputEventCallback;
  private onLaneUpCb?: InputReleaseCallback;
  private activeKeys: Set<string> = new Set();
  private touchLaneMap: Map<number, number> = new Map(); // touchId -> laneIndex

  // Default drum key mappings
  private keyToLane: Record<string, number> = {
    // Drum layout 1: F G H J + Space
    KeyF: 0, // Kick / Pad 1
    KeyG: 1, // Snare / Pad 2
    KeyH: 2, // Hi-Hat / Pad 3
    KeyJ: 3, // Crash / Pad 4
    Space: 0, // Kick pedal alternate

    // Drum layout 2 (ergonomic hands): D F J K
    KeyD: 0,
    KeyK: 3,

    // Arrow keys fallback
    ArrowLeft: 0,
    ArrowDown: 1,
    ArrowUp: 2,
    ArrowRight: 3,
  };

  private boundKeyDown = this.handleKeyDown.bind(this);
  private boundKeyUp = this.handleKeyUp.bind(this);

  public init(onDown: InputEventCallback, onUp?: InputReleaseCallback): void {
    this.onLaneDownCb = onDown;
    this.onLaneUpCb = onUp;

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.activeKeys.clear();
    this.touchLaneMap.clear();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent scrolling or unwanted browser keys when playing
    if (e.code === 'Space' || e.code.startsWith('Arrow')) {
      e.preventDefault();
    }

    if (e.repeat) return; // Ignore OS auto-repeat

    const lane = this.keyToLane[e.code];
    if (lane !== undefined && !this.activeKeys.has(e.code)) {
      this.activeKeys.add(e.code);
      this.triggerLaneDown(lane);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const lane = this.keyToLane[e.code];
    if (lane !== undefined) {
      this.activeKeys.delete(e.code);
      this.triggerLaneUp(lane);
    }
  }

  public triggerLaneDown(lane: number): void {
    const now = performance.now();
    this.onLaneDownCb?.(lane, now);
  }

  public triggerLaneUp(lane: number): void {
    this.onLaneUpCb?.(lane);
  }

  /**
   * Helper for touch-zone buttons
   */
  public handleTouchStart(touchId: number, lane: number): void {
    this.touchLaneMap.set(touchId, lane);
    this.triggerLaneDown(lane);
  }

  public handleTouchEnd(touchId: number): void {
    const lane = this.touchLaneMap.get(touchId);
    if (lane !== undefined) {
      this.touchLaneMap.delete(touchId);
      this.triggerLaneUp(lane);
    }
  }
}
