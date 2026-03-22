import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { BaseNodeComponent } from './BaseNode';

const RegulatorTubeNode = memo(({ ...props }: NodeProps) => (
    <BaseNodeComponent nodeProps={props} width={40} height={40} svgContent={
        <img style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }} src="regulator_tube.png" alt="Regulator Tube" />
    } />
));
RegulatorTubeNode.displayName = 'RegulatorTubeNode';
export default RegulatorTubeNode;
