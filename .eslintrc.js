// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  env: {
    browser: false,
    node: true
  },
  parserOptions: {
    "ecmaVersion": 6,
    "ecmaFeatures": {
      "modules": true
    }
  },
  // add your custom rules here
  rules: {
    "no-console": "off",
    "indent": "off",
    // "indent": [
    //   "warn",
    //   4
    // ],
    "no-var": [
      "warn"
    ],
    "prefer-const": [
      "warn"
    ],
    "linebreak-style": [
      "error",
      "windows"
    ],
    "quotes": [
      "error",
      "double"
    ],
    "semi": [
      "error",
      "always"
    ],
    // allow async-await
    "generator-star-spacing": "off",
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    "linebreak-style": [1, "windows"]
  }
}
