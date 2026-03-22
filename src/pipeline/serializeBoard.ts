import { comp, int, string, intArray, longArray, list, float, byte } from 'prismarine-nbt';
import type { CircuitComponent, WireCell } from '../types/circuit';

/**
 * Generates a compliant 4-integer Minecraft UUID
 */
function generateUUID(): [number, number, number, number] {
    const r = () => Math.floor(Math.random() * 4294967296) - 2147483648;
    return [r(), r(), r(), r()];
}

/**
 * Builds the modular namespaced Properties Compound for any ComponentType
 */
function buildComponentProperties(c: CircuitComponent): Record<string, any> {
    const props: Record<string, any> = {};

    // 1. Global / Shared Properties
    props['powergrid:orientation'] = int(c.orientation || 0);

    // 2. Component-Specific Properties
    switch (c.type) {
        case 'resistor':
            props['powergrid:vertical'] = byte(1); // Natively must be TAG_Byte
            props['powergrid:resistor_value'] = float(c.value !== undefined ? c.value : 100.0);
            break;
        case 'static_induction_transistor':
        case 'npn_bjt':
        case 'pnp_bjt':
            // Foundation laid for future transistor properties
            break;
    }

    // Wrap the dictionary as a native prismarine-nbt Compound Tag
    return comp(props);
}

/**
 * Given a localized list of components and wires for a single 16x16 board,
 * generates the specific NBT block entity data mapping.
 */
export function serializeBoard(components: CircuitComponent[], wires: WireCell[], boardX: number, boardY: number): Record<string, any> {
    const nbtComponents: any[] = [];
    
    // Board origins in continuous grid cell space
    const startX = boardX * 16;
    const startY = boardY * 16;

    // 1. Process Components
    for (const c of components) {
        // Calculate strictly local coordinates [0-15]
        const localX = c.position.x - startX;
        const localY = c.position.y - startY;

        nbtComponents.push({
            X: int(localX),
            Y: int(localY),
            Id: string(`powergrid:${c.type}`),
            UUID: intArray(generateUUID()),
            Properties: buildComponentProperties(c)
        });
    }

    // 2. Process Wire Grid Matrix
    const frontArray = new Int8Array(256); // Defaults to 0
    const backArray = new Int8Array(256);

    for (const w of wires) {
        const localX = w.x - startX;
        const localY = w.y - startY;
        const index = (localY * 16) + localX;

        if (w.layer === 'front') {
            frontArray[index] = 1;
        } else if (w.layer === 'back') {
            backArray[index] = 1;
        }
    }

    // Sub-routine to pack 256 byte-pixels into 4 Java-compatible 64-bit Longs
    const packWiresToLongs = (pixels: Int8Array): bigint[] => {
        // Initialize exactly 4 native BigInts
        const longs = [0n, 0n, 0n, 0n];

        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                if (pixels[(y * 16) + x]) {
                    const longIndex = Math.floor(y / 4); 
                    
                    // Calculate the exact bit position (0 to 63) within this specific Long
                    // y % 4 gives us the row within the Long (0-3). Multiply by 16 columns.
                    const bitIndex = BigInt((y % 4) * 16 + x);
                    
                    // Simply shift 1 by the bit index and OR it into the Long
                    longs[longIndex] |= (1n << bitIndex);
                }
            }
        }

        // Force signed 64-bit limits as required by NBT before handing off natively
        return longs.map(val => BigInt.asIntN(64, val));
    };

    // 3. Construct Payload
    return comp({
        Components: list(comp(nbtComponents)),
        Front: longArray(packWiresToLongs(frontArray)),
        Back: longArray(packWiresToLongs(backArray))
    });
}
