// Local fixture only: preserve the production component's router call without Next routing.
export function useRouter() {
  return { push: (path: string) => window.history.pushState(null, "", path) };
}
