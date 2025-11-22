// @ts-check
import css from '@eslint/css';
import js from '@eslint/js';
import json from '@eslint/json';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import { configs as tseslintConfigs } from 'typescript-eslint';
import { configs as angularConfigs, processInlineTemplates } from 'angular-eslint';
import { flatConfigs as importXConfigs } from 'eslint-plugin-import-x';
import prettierConfig from 'eslint-plugin-prettier/recommended';

export default defineConfig(
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      importXConfigs.recommended,
      importXConfigs.typescript,
      stylistic.configs.customize({ semi: true }),
      ...tseslintConfigs.strictTypeChecked,
      ...tseslintConfigs.stylisticTypeChecked,
      ...angularConfigs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    processor: processInlineTemplates,
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      'object-shorthand': 'error',
      'no-console': [
        'warn',
        {
          allow: ['error'],
        },
      ],
      'dot-notation': 'off',
      'no-unused-vars': 'off',
      'no-unused-private-class-members': 'error',
      'no-bitwise': 'error',
      'import-x/consistent-type-specifier-style': [
        'error',
        'prefer-top-level',
      ],
      'import-x/order': [
        'error',
        {
          'newlines-between': 'always',
          'groups': [
            ['type'],
            ['builtin', 'external', 'internal'],
            ['parent', 'sibling', 'index'],
            ['object'],
          ],
          'alphabetize': {
            order: 'asc',
          },
        },
      ],
      'import-x/no-duplicates': 'error',
      'import-x/no-useless-path-segments': 'error',
      '@stylistic/arrow-parens': [
        'error',
        'always',
      ],
      '@stylistic/brace-style': [
        'error',
        'stroustrup',
      ],
      '@stylistic/comma-dangle': [
        'error',
        'always-multiline',
      ],
      '@stylistic/indent': [
        'error',
        2,
        {
          SwitchCase: 1,
        },
      ],
      '@stylistic/newline-per-chained-call': 'error',
      '@stylistic/padded-blocks': [
        'error',
        {
          classes: 'always',
          blocks: 'never',
          switches: 'never',
        },
      ],
      '@stylistic/quotes': [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: 'avoidEscape',
        },
      ],
      '@stylistic/semi': [
        'error',
        'always',
      ],
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
          catch: 'always',
        },
      ],
      '@stylistic/type-annotation-spacing': 'error',
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array-simple',
          readonly: 'generic',
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
          trailingUnderscore: 'forbid',
        },
        {
          selector: ['typeLike', 'enumMember'],
          format: ['PascalCase'],
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'UPPER_CASE'],
        },
        {
          selector: 'classProperty',
          modifiers: ['readonly'],
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        },
        {
          selector: ['parameter'],
          modifiers: ['unused'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
        {
          selector: ['classProperty', 'objectLiteralProperty', 'typeProperty', 'classMethod', 'objectLiteralMethod', 'typeMethod', 'accessor', 'enumMember'],
          modifiers: ['requiresQuotes'],
          format: null,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-unused-private-class-members': 'error',
      '@typescript-eslint/dot-notation': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'explicit',
          overrides: {
            constructors: 'no-public',
          },
        },
      ],
      '@typescript-eslint/consistent-type-definitions': [
        'error',
        'type',
      ],
      '@typescript-eslint/no-extraneous-class': [
        'error',
        {
          allowWithDecorator: true,
          allowStaticOnly: true,
        },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allow: ['unknown'],
          allowNumber: true,
        },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        {
          considerDefaultExhaustiveForUnions: true,
        },
      ],
      '@typescript-eslint/unbound-method': [
        'error',
        {
          ignoreStatic: true,
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      prettierConfig,
      // @ts-ignore
      ...angularConfigs.templateRecommended,
      // @ts-ignore
      ...angularConfigs.templateAccessibility,
    ],
    rules: {
      'prettier/prettier': [
        'error',
        {
          parser: 'angular',
          printWidth: 180,
        },
      ],
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/button-has-type': 'error',
    },
  },
  {
    files: ['**/*.scss'],
    extends: [
      prettierConfig,
    ],
    plugins: {
      css,
    },
    language: 'css/css',
    languageOptions: {
      tolerant: true,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          parser: 'scss',
        },
      ],
      'css/font-family-fallbacks': 'error',
      'css/no-important': 'error',
      'css/relative-font-units': 'error',
    },
  },
  {
    files: ['**/*.json'],
    ignores: ['package-lock.json'],
    extends: [
      json.configs.recommended,
    ],
    plugins: {
      json,
    },
    language: 'json/jsonc',
    rules: {
      'json/no-duplicate-keys': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    extends: [
      js.configs.recommended,
      stylistic.configs.customize({ semi: true }),
    ],
    plugins: {
      js,
    },
    rules: {},
  },
);
