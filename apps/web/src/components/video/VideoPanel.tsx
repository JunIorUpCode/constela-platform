"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  ControlBar,
  RoomAudioRenderer,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

interface VideoPanelProps {
  token: string;
  serverUrl: string;
  roomName: string;
  onLeave?: () => void;
  isHost?: boolean;
}

export function VideoPanel({
  token,
  serverUrl,
  roomName,
  onLeave,
  isHost = false,
}: VideoPanelProps) {
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      video={true}
      audio={true}
      onDisconnected={onLeave}
      className="video-panel"
    >
      <VideoRoom isHost={isHost} onLeave={onLeave} />
    </LiveKitRoom>
  );
}

interface VideoRoomProps {
  isHost: boolean;
  onLeave?: () => void;
}

function VideoRoom({ isHost, onLeave }: VideoRoomProps) {
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant) => (
            <ParticipantTile
              key={participant.identity}
              participant={participant}
              isHost={isHost && participant.isLocal}
            />
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-4 border-t border-gray-700">
        <ControlBar
          controls={{
            microphone: true,
            camera: true,
            screenShare: isHost,
            chat: true,
            leave: true,
          }}
        />
      </div>

      <RoomAudioRenderer />
    </div>
  );
}

interface ParticipantTileProps {
  participant: any;
  isHost: boolean;
}

function ParticipantTile({ participant, isHost }: ParticipantTileProps) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
      {/* Video track */}
      {tracks.length > 0 && (
        <div className="absolute inset-0">
          <VideoTrack track={tracks[0]} />
        </div>
      )}

      {/* Placeholder if no video */}
      {tracks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-gray-300">
            {participant.name?.[0] || participant.identity?.[0] || "?"}
          </div>
        </div>
      )}

      {/* Name label */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium truncate">
            {participant.name || participant.identity}
          </span>
          {isHost && (
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
              Host
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function VideoTrack({ track }: { track: any }) {
  return (
    <img
      src={track.track?.attach?.()?.src}
      alt="Video"
      className="w-full h-full object-cover"
    />
  );
}

export default VideoPanel;
