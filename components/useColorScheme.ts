import { useColorScheme as useColorSchemeCore } from 'react-native';

// react-native's useColorScheme() can return null/undefined (e.g. before
// the OS has reported a preference) or, on some platforms, 'unspecified'
// -- always fall back to 'light' here so callers never need their own
// `?? "light"` guard.
export const useColorScheme = (): 'light' | 'dark' => {
  const scheme = useColorSchemeCore();
  return scheme === 'dark' ? 'dark' : 'light';
};
