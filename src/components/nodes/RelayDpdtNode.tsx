import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { BaseNodeComponent } from './BaseNode';

const RelayDpdtNode = memo(({ ...props }: NodeProps) => (
    <BaseNodeComponent nodeProps={props} width={80} height={80} svgContent={
        <img style={{ imageRendering: 'pixelated', height: '100%' }} src="relay_dpdt.png" alt="DPDT Relay" />
    } />
));
RelayDpdtNode.displayName = 'RelayDpdtNode';
export default RelayDpdtNode;
