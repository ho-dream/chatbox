/// <reference types="@rsbuild/core/types" />
/// <reference types="@types/node" />

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    RUNTIME_ENV: 'web' | 'electron-preload' | 'electron-main';
  }
}

declare module '*.svg' {
  import type React from 'react';

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}
