export interface VideoCallConfig {
  sessionId: string;
  userId: string;
  userName: string;
  isVideo: boolean;
  isAudio: boolean;
}

export class VideoCallManager {
  private localStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private remoteStream: MediaStream | null = null;

  async initializeCall(config: VideoCallConfig): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: config.isVideo,
        audio: config.isAudio
      });

      console.log('Local stream initialized:', this.localStream);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw new Error('Unable to access camera or microphone');
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  async endCall(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }

  async shareScreen(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      return screenStream;
    } catch (error) {
      console.error('Error sharing screen:', error);
      throw new Error('Unable to share screen');
    }
  }
}

export function checkWebRTCSupport(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.RTCPeerConnection
  );
}

export function optimizeVideoForBandwidth(lowBandwidth: boolean): MediaTrackConstraints {
  if (lowBandwidth) {
    return {
      width: { ideal: 320 },
      height: { ideal: 240 },
      frameRate: { ideal: 15, max: 20 }
    };
  }

  return {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 30 }
  };
}
