/// <reference types="@rsbuild/core/types" />
/// <reference types="@types/node" />

type ArrayElement<ArrayType extends readonly unknown[] | undefined> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

declare interface ProcessEnv {
  NODE_ENV: 'development' | 'production' | 'test';
}
