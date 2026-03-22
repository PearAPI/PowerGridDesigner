import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { BaseNodeComponent } from './BaseNode';

const BarretterTubeNode = memo(({ ...props }: NodeProps) => (
    <BaseNodeComponent nodeProps={props} width={20} height={20} svgContent={
        <img style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }} src="barretter_tube.png" alt="Barretter Tube" />
    } />
));
BarretterTubeNode.displayName = 'BarretterTubeNode';
export default BarretterTubeNode;
