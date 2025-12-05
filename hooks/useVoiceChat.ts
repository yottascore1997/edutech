import { useCallback, useEffect, useRef, useState } from 'react';

type SignalingFns = {
  emitOffer?: (peerId: string, sdp: any) => void;
  emitAnswer?: (peerId: string, sdp: any) => void;
  emitCandidate?: (peerId: string, candidate: any) => void;
};

type VoiceChatApi = {
  supported: boolean;
  isMicOn: boolean;
  setSignalingFns: (fns: SignalingFns) => void;
  join: () => Promise<void>;
  leave: () => void;
  createOfferTo: (peerId: string) => Promise<void>;
  handleOffer: (from: string, sdp: any) => Promise<void>;
  handleAnswer: (from: string, sdp: any) => Promise<void>;
  handleCandidate: (from: string, candidate: any) => Promise<void>;
  setMicEnabled: (enabled: boolean) => void;
  dropPeer: (peerId: string) => void;
};

export default function useVoiceChat(): VoiceChatApi {
  const webrtcRef = useRef<any>(null);
  const inCallRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const peersRef = useRef<Record<string, any>>({});
  const makingOfferRef = useRef<Record<string, boolean>>({});
  const [isMicOn, setIsMicOn] = useState(false);
  const [supported] = useState(() => {
    try {
      // Lazy require to avoid bundling errors when module is missing
      const rnWebrtc = require('react-native-webrtc');
      webrtcRef.current = rnWebrtc;
      try {
        inCallRef.current = require('react-native-incall-manager');
      } catch {}
      return !!rnWebrtc;
    } catch {
      return false;
    }
  });

  const signalingFnsRef = useRef<SignalingFns>({});
  const setSignalingFns = useCallback((fns: SignalingFns) => {
    signalingFnsRef.current = fns || {};
  }, []);

  const ensureLocalStream = useCallback(async () => {
    if (!supported) return null;
    if (!localStreamRef.current) {
      const { mediaDevices } = webrtcRef.current;
      localStreamRef.current = await mediaDevices.getUserMedia({ audio: true, video: false });
      // Route audio to speaker if possible
      try {
        const InCallManager = inCallRef.current?.default || inCallRef.current;
        InCallManager?.start({ media: 'audio' });
        InCallManager?.setSpeakerphoneOn(true);
      } catch {}
    }
    return localStreamRef.current;
  }, [supported]);

  const setMicEnabled = useCallback((enabled: boolean) => {
    if (!supported) return;
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks?.().forEach((t: any) => (t.enabled = enabled));
      setIsMicOn(enabled);
    }
  }, [supported]);

  const getPeer = useCallback(async (peerId: string) => {
    if (!supported) return null;
    if (peersRef.current[peerId]) return peersRef.current[peerId];
    const { RTCPeerConnection } = webrtcRef.current;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

    pc.onicecandidate = (e: any) => {
      if (e.candidate) {
        signalingFnsRef.current.emitCandidate?.(peerId, e.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
        try { pc.close(); } catch {}
        delete peersRef.current[peerId];
      }
    };

    // Attach local track
    const stream = await ensureLocalStream();
    stream?.getTracks?.().forEach((track: any) => pc.addTrack(track, stream));

    peersRef.current[peerId] = pc;
    return pc;
  }, [ensureLocalStream, supported]);

  const createOfferTo = useCallback(async (peerId: string) => {
    if (!supported) return;
    const pc = await getPeer(peerId);
    if (!pc) return;
    if (pc.signalingState !== 'stable' || makingOfferRef.current[peerId]) return;
    makingOfferRef.current[peerId] = true;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signalingFnsRef.current.emitOffer?.(peerId, offer);
    } finally {
      makingOfferRef.current[peerId] = false;
    }
  }, [getPeer, supported]);

  const handleOffer = useCallback(async (from: string, sdp: any) => {
    if (!supported) return;
    const pc = await getPeer(from);
    if (!pc) return;
    try {
      if (pc.signalingState !== 'stable') return;
      await pc.setRemoteDescription(sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signalingFnsRef.current.emitAnswer?.(from, answer);
    } catch {}
  }, [getPeer, supported]);

  const handleAnswer = useCallback(async (from: string, sdp: any) => {
    if (!supported) return;
    const pc = await getPeer(from);
    if (!pc) return;
    try {
      if (pc.signalingState !== 'have-local-offer') return;
      if (pc.currentRemoteDescription && pc.currentRemoteDescription.sdp === (sdp as any)?.sdp) return;
      await pc.setRemoteDescription(sdp);
    } catch {}
  }, [getPeer, supported]);

  const handleCandidate = useCallback(async (from: string, candidate: any) => {
    if (!supported) return;
    const pc = await getPeer(from);
    if (!pc) return;
    try {
      const { RTCIceCandidate } = webrtcRef.current;
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch {}
  }, [getPeer, supported]);

  const dropPeer = useCallback((peerId: string) => {
    const pc = peersRef.current[peerId];
    if (pc) {
      try { pc.close(); } catch {}
      delete peersRef.current[peerId];
    }
  }, []);

  const join = useCallback(async () => {
    if (!supported) return;
    await ensureLocalStream();
    setMicEnabled(false);
  }, [ensureLocalStream, setMicEnabled, supported]);

  const leave = useCallback(() => {
    Object.values(peersRef.current).forEach((pc) => {
      try { pc.close(); } catch {}
    });
    peersRef.current = {};
    const stream = localStreamRef.current;
    if (stream) {
      try { stream.getTracks?.().forEach((t: any) => t.stop?.()); } catch {}
      localStreamRef.current = null;
    }
    try {
      const InCallManager = inCallRef.current?.default || inCallRef.current;
      InCallManager?.stop();
    } catch {}
    setIsMicOn(false);
  }, []);

  useEffect(() => {
    return () => {
      leave();
    };
  }, [leave]);

  return {
    supported,
    isMicOn,
    setSignalingFns,
    join,
    leave,
    createOfferTo,
    handleOffer,
    handleAnswer,
    handleCandidate,
    setMicEnabled,
    dropPeer,
  };
}



