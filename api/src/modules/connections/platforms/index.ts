import type { Platform } from '@easy-vibe-coding/shared';
import { bigcommerceClient } from './bigcommerce';
import { shopifyClient } from './shopify';
import type { PlatformClient } from './types';

// The platform factory — the service never branches on platform; adding a
// third platform is one client file + one case here.
export function getPlatformClient(platform: Platform): PlatformClient {
	switch (platform) {
		case 'shopify':
			return shopifyClient;
		case 'bigcommerce':
			return bigcommerceClient;
	}
}
