import { envToBool } from '$lib/utils/toBool';

interface FeatureFlags {
	enableFeature1: boolean;
}

export const FeatureFlags: FeatureFlags = {
	enableFeature1: envToBool(import.meta.env.VITE_ENABLE_FEATURE_1) ?? false
};
