import React from 'react';
import { useWebSocketContext } from './WebSocketProvider';
import { Badge } from '@/components/ui/badge';

export function WebSocketStatus() {
  const { connectionStatus } = useWebSocketContext();

  let badgeVariant = 'outline';
  let statusText = 'Offline';
  
  if (connectionStatus === 'open') {
    badgeVariant = 'default';
    statusText = 'Connected';
  } else if (connectionStatus === 'connecting') {
    badgeVariant = 'secondary';
    statusText = 'Connecting...';
  } else if (connectionStatus === 'reconnecting') {
    badgeVariant = 'secondary';
    statusText = 'Reconnecting...';
  } else if (connectionStatus === 'closing' || connectionStatus === 'closed') {
    badgeVariant = 'destructive';
    statusText = 'Disconnected';
  }

  return (
    <Badge 
      variant={badgeVariant as any} 
      className="text-xs"
    >
      {statusText}
    </Badge>
  );
}