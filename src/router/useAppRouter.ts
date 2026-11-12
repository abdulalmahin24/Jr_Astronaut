import { useState, useEffect, useCallback } from 'react';

export type AppRoute = 
  | 'home'
  | 'explore'
  | 'mission'
  | 'academy'
  | 'simulators'
  | 'campaign'
  | 'learning'
  | 'teacher';

export interface RouteState {
  route: AppRoute;
  params: Record<string, string>;
}

const ROUTE_HASH_MAP: Record<string, AppRoute> = {
  '': 'home',
  '/': 'home',
  '#/': 'home',
  '#home': 'home',
  '#/home': 'home',
  '#explore': 'explore',
  '#/explore': 'explore',
  '#mission': 'mission',
  '#/mission': 'mission',
  '#academy': 'academy',
  '#/academy': 'academy',
  '#simulators': 'simulators',
  '#/simulators': 'simulators',
  '#campaign': 'campaign',
  '#/campaign': 'campaign',
  '#learning': 'learning',
  '#/learning': 'learning',
  '#teacher': 'teacher',
  '#/teacher': 'teacher',
};

function parseHash(hash: string): RouteState {
  const cleanHash = hash.replace(/^#/, '');
  const [pathPart, queryPart] = cleanHash.split('?');
  const normalizedPath = (pathPart || '/').toLowerCase();

  let route: AppRoute = 'home';
  for (const [key, val] of Object.entries(ROUTE_HASH_MAP)) {
    const cleanKey = key.replace(/^#/, '').toLowerCase();
    if (normalizedPath === cleanKey || normalizedPath === `/${cleanKey}`) {
      route = val;
      break;
    }
  }

  const params: Record<string, string> = {};
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  return { route, params };
}

export function useAppRouter() {
  const [routeState, setRouteState] = useState<RouteState>(() => {
    if (typeof window !== 'undefined') {
      return parseHash(window.location.hash);
    }
    return { route: 'home', params: {} };
  });

  useEffect(() => {
    const handleHashChange = () => {
      setRouteState(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((route: AppRoute, params?: Record<string, string>, replace = false) => {
    let hash = `#/${route === 'home' ? '' : route}`;
    if (params && Object.keys(params).length > 0) {
      const sp = new URLSearchParams(params);
      hash += `?${sp.toString()}`;
    }
    
    if (replace) {
      window.location.replace(hash);
    } else {
      window.location.hash = hash;
    }
    setRouteState({ route, params: params || {} });
  }, []);

  return {
    route: routeState.route,
    params: routeState.params,
    navigate,
  };
}
