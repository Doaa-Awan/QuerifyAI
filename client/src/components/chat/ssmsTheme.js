/**
 * SSMS-inspired Prism syntax theme for react-syntax-highlighter.
 * Colors adapted from SQL Server Management Studio defaults for a dark background.
 *
 * Background: --surface (#1c1d21) from index.css
 * Default text: --ink (rgba(242, 239, 233, 0.718))
 */
export const ssmsTheme = {
  'code[class*="language-"]': {
    color: 'rgba(242, 239, 233, 0.718)',
    background: 'none',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.6',
    tabSize: '4',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: 'rgba(242, 239, 233, 0.718)',
    background: 'none',
    margin: '0',
    padding: '0',
    overflow: 'auto',
  },

  // Keywords — SSMS blue (#0000FF), lightened for dark bg
  'keyword': { color: '#569CD6' },

  // String literals — SSMS red (#FF0000), softened for dark bg
  'string': { color: '#CE9178' },

  // Comments — SSMS green (#008000)
  'comment': { color: '#6A9955', fontStyle: 'italic' },
  'prolog': { color: '#6A9955' },
  'cdata': { color: '#6A9955' },

  // Numbers
  'number': { color: '#B5CEA8' },

  // T-SQL variables (@param)
  'variable': { color: '#9CDCFE' },

  // Operators and punctuation — neutral
  'operator': { color: 'rgba(242, 239, 233, 0.718)' },
  'punctuation': { color: 'rgba(242, 239, 233, 0.6)' },

  // Functions, identifiers — default text
  'function': { color: 'rgba(242, 239, 233, 0.718)' },

  // Booleans / constants treated like keywords
  'boolean': { color: '#569CD6' },
  'constant': { color: '#569CD6' },

  // Table/column names
  'class-name': { color: 'rgba(242, 239, 233, 0.718)' },
};
