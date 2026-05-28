import StyleDictionary from 'style-dictionary';

// Transforms design-tokens/**/*.json into CSS custom properties.
// Output: src/styles/generated/_tokens.css
// Run: npm run tokens
const sd = new StyleDictionary({
  source: ['design-tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'jm',
      buildPath: 'src/styles/generated/',
      files: [
        {
          destination: '_tokens.css',
          format: 'css/variables',
          options: { outputReferences: false },
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();
