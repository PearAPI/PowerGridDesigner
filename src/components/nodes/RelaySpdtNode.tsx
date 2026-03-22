import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { BaseNodeComponent } from './BaseNode';

const RelaySpdtNode = memo(({ ...props }: NodeProps) => (
    <BaseNodeComponent nodeProps={props} width={60} height={80} svgContent={
        <img style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }} src="relay.png" alt="SPDT Relay" />
    } />
));
RelaySpdtNode.displayName = 'RelaySpdtNode';
export default RelaySpdtNode;
