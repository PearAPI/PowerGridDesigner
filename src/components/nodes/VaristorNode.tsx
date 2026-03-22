import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { BaseNodeComponent } from './BaseNode';

const VaristorNode = memo(({ ...props }: NodeProps) => (
    <BaseNodeComponent nodeProps={props} width={60} height={60} svgContent={
        <img style={{ imageRendering: 'pixelated', width: '100%', height: '100%' }} src="varistor.png" alt="Varistor" />
    } />
));
VaristorNode.displayName = 'VaristorNode';
export default VaristorNode;
