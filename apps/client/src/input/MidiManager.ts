/**
 * Web MIDI API Manager for Band League.
 * Listens for hardware MIDI inputs (keyboards, drum pads) and converts to lane hits.
 */

export class MidiManager {
  private midiAccess: any = null;
  private onNoteDownCb?: (lane: number, noteNumber: number, velocity: number) => void;
  private onNoteUpCb?: (lane: number, noteNumber: number) => void;
  private isConnected: boolean = false;
  private connectedDeviceName: string = '';

  public async init(
    onNoteDown: (lane: number, noteNumber: number, velocity: number) => void,
    onNoteUp?: (lane: number, noteNumber: number) => void
  ): Promise<boolean> {
    this.onNoteDownCb = onNoteDown;
    this.onNoteUpCb = onNoteUp;

    const nav = navigator as any;
    if (!nav.requestMIDIAccess) {
      return false;
    }

    try {
      this.midiAccess = await nav.requestMIDIAccess({ sysex: false });
      const inputs = Array.from(this.midiAccess.inputs.values()) as any[];
      if (inputs.length > 0) {
        this.connectedDeviceName = inputs[0].name || 'MIDI Device';
        this.isConnected = true;
      }

      inputs.forEach((input: any) => {
        input.onmidimessage = this.handleMidiMessage.bind(this);
      });

      this.midiAccess.onstatechange = (e: any) => {
        if (e.port.type === 'input') {
          if (e.port.state === 'connected') {
            e.port.onmidimessage = this.handleMidiMessage.bind(this);
            this.isConnected = true;
            this.connectedDeviceName = e.port.name || 'MIDI Device';
          }
        }
      };

      return this.isConnected;
    } catch {
      return false;
    }
  }

  public getStatus(): { isConnected: boolean; deviceName: string } {
    return { isConnected: this.isConnected, deviceName: this.connectedDeviceName };
  }

  private handleMidiMessage(event: any): void {
    const data = event.data;
    if (!data || data.length < 3) return;

    const command = data[0] >> 4;
    const note = data[1];
    const velocity = data[2];

    if (command === 9 && velocity > 0) {
      const pitchClass = note % 12;
      const naturalKeyMap: Record<number, number> = {
        0: 0, // C -> Lane 0
        2: 1, // D -> Lane 1
        4: 2, // E -> Lane 2
        5: 3, // F -> Lane 3
        7: 4, // G -> Lane 4
        9: 5, // A -> Lane 5
        11: 6 // B -> Lane 6
      };
      const lane = naturalKeyMap[pitchClass] ?? (pitchClass % 4);
      this.onNoteDownCb?.(lane, note, velocity);
    } else if (command === 8 || (command === 9 && velocity === 0)) {
      const pitchClass = note % 12;
      const lane = pitchClass % 4;
      this.onNoteUpCb?.(lane, note);
    }
  }

  public destroy(): void {
    if (this.midiAccess) {
      try {
        const inputs = Array.from(this.midiAccess.inputs.values()) as any[];
        inputs.forEach((input: any) => {
          input.onmidimessage = null;
        });
      } catch {
        // ignore
      }
      this.midiAccess = null;
    }
  }
}
