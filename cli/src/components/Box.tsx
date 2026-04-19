import React from 'react';
import { Box as InkBox, type BoxProps } from 'ink';

/**
 * Re-export of Ink's Box component.
 * Use directly for all container needs.
 * 
 * @example
 * <Box borderStyle="round" padding={1}>
 *   <Text>Content</Text>
 * </Box>
 */
export const Box = InkBox;
export type { BoxProps };
export default Box;
