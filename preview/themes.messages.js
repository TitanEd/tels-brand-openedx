import { defineMessages } from 'react-intl';

const messages = defineMessages({
  title: { id: 'design-tokens.themes.title', defaultMessage: 'Themes', description: 'Heading of the list of theme templates.' },
  intro: {
    id: 'design-tokens.themes.intro',
    defaultMessage: 'A theme sets the most important colors and fonts for light and dark screens at once. Choose one, then change any design token below.',
    description: 'Text under the Themes heading.',
  },
  listLabel: { id: 'design-tokens.themes.list', defaultMessage: 'Theme templates', description: 'Accessible name of the scrolling list of themes.' },
  previous: { id: 'design-tokens.themes.previous', defaultMessage: 'Previous themes', description: 'Accessible name of the button that scrolls the list of themes back.' },
  next: { id: 'design-tokens.themes.next', defaultMessage: 'Next themes', description: 'Accessible name of the button that scrolls the list of themes forward.' },
  loading: { id: 'design-tokens.themes.loading', defaultMessage: 'Loading themes…', description: 'Shown while the themes load.' },
  loadFailed: {
    id: 'design-tokens.themes.load-failed',
    defaultMessage: 'The themes could not be loaded. Check that "npm run preview" is running, then reload the page.',
    description: 'Error when the list of themes cannot be read from the server.',
  },
  saveFailed: {
    id: 'design-tokens.themes.save-failed',
    defaultMessage: 'The themes could not be saved. Check that "npm run preview" is running, then try again.',
    description: 'Error when the list of themes cannot be written to the server.',
  },

  // Cards
  codeName: { id: 'design-tokens.themes.code.name', defaultMessage: 'Code theme', description: 'Name of the theme with the values of the token files.' },
  codeText: {
    id: 'design-tokens.themes.code.text',
    defaultMessage: 'The values written in the token files (paragon/tokens/src), without saved changes.',
    description: 'Description of the theme with the values of the token files.',
  },
  created: { id: 'design-tokens.themes.card.created', defaultMessage: 'Created {date}', description: 'When a theme was made. {date} is a date.' },
  inUse: { id: 'design-tokens.themes.card.in-use', defaultMessage: 'In use', description: 'Badge on the theme that is applied.' },
  changed: {
    id: 'design-tokens.themes.card.changed',
    defaultMessage: 'Changed since chosen',
    description: 'Badge on the applied theme when design tokens were changed after it was chosen.',
  },
  swatchMode: {
    id: 'design-tokens.themes.card.swatch-mode',
    defaultMessage: '{mode}, {name}: {value}',
    description: 'Accessible name of a color dot. {mode} is "Light" or "Dark", {name} e.g. "Primary", {value} a hex color.',
  },
  font: { id: 'design-tokens.themes.card.font', defaultMessage: 'Font: {font}', description: 'The body font of a theme. {font} is a font name.' },
  use: { id: 'design-tokens.themes.card.use', defaultMessage: 'Use theme', description: 'Button that applies a theme.' },
  useAria: { id: 'design-tokens.themes.card.use.aria', defaultMessage: 'Use the theme {name}', description: 'Accessible name of the Use theme button.' },
  edit: { id: 'design-tokens.themes.card.edit', defaultMessage: 'Edit {name}', description: 'Accessible name of the button that edits a theme.' },
  remove: { id: 'design-tokens.themes.card.delete', defaultMessage: 'Delete {name}', description: 'Accessible name of the button that deletes a theme.' },
  create: { id: 'design-tokens.themes.create', defaultMessage: 'Create theme', description: 'Button that opens the form for a new theme.' },
  createText: {
    id: 'design-tokens.themes.create.text',
    defaultMessage: 'Pick a few colors and fonts; every design token follows them.',
    description: 'Text on the card that creates a theme.',
  },

  // Applying and deleting
  confirmUse: {
    id: 'design-tokens.themes.confirm.use.title',
    defaultMessage: 'Use the theme “{name}”?',
    description: 'Title of the confirmation before a theme is applied. {name} is the theme name.',
  },
  confirmUseText: {
    id: 'design-tokens.themes.confirm.use.text',
    defaultMessage: 'It replaces all values saved for light and dark. Every change stays in History, so you can undo it.',
    description: 'Text of the confirmation before a theme is applied.',
  },
  confirmCode: {
    id: 'design-tokens.themes.confirm.code.title',
    defaultMessage: 'Go back to the values of the token files?',
    description: 'Title of the confirmation before the theme of the token files is applied.',
  },
  confirmCodeText: {
    id: 'design-tokens.themes.confirm.code.text',
    defaultMessage: 'All values saved for light and dark are removed. Every change stays in History, so you can undo it.',
    description: 'Text of the confirmation before the theme of the token files is applied.',
  },
  confirmCodeButton: {
    id: 'design-tokens.themes.confirm.code.button',
    defaultMessage: 'Use the token files',
    description: 'Button that confirms going back to the values of the token files.',
  },
  confirmDelete: {
    id: 'design-tokens.themes.confirm.delete.title',
    defaultMessage: 'Delete the theme “{name}”?',
    description: 'Title of the confirmation before a theme is deleted. {name} is the theme name.',
  },
  confirmDeleteText: {
    id: 'design-tokens.themes.confirm.delete.text',
    defaultMessage: 'The theme cannot be restored. The values it saved stay until you choose another theme.',
    description: 'Text of the confirmation before a theme is deleted.',
  },
  confirmDeleteButton: { id: 'design-tokens.themes.confirm.delete.button', defaultMessage: 'Delete theme', description: 'Button that confirms deleting a theme.' },
  applied: { id: 'design-tokens.themes.applied', defaultMessage: 'The theme “{name}” is in use for light and dark.', description: 'Message after a theme was applied.' },
  codeApplied: {
    id: 'design-tokens.themes.code.applied',
    defaultMessage: 'The values of the token files are back for light and dark.',
    description: 'Message after the theme of the token files was applied.',
  },
  deleted: { id: 'design-tokens.themes.deleted', defaultMessage: 'The theme “{name}” was deleted.', description: 'Message after a theme was deleted.' },

  // Previewing a theme
  previewButton: { id: 'design-tokens.themes.preview.button', defaultMessage: 'Preview', description: 'Button that shows a theme on the page and in the apps without saving it.' },
  previewAria: { id: 'design-tokens.themes.preview.button.aria', defaultMessage: 'Preview the theme {name}', description: 'Accessible name of the Preview button of a theme card.' },
  previewHelp: {
    id: 'design-tokens.themes.preview.help',
    defaultMessage: 'Preview shows the theme on this page and in every app, without saving it.',
    description: 'Text next to the Preview button of the theme form.',
  },
  previewing: { id: 'design-tokens.themes.preview.badge', defaultMessage: 'Previewing', description: 'Badge on the theme card that is shown as a preview.' },
  previewStarted: {
    id: 'design-tokens.themes.preview.started',
    defaultMessage: 'The theme “{name}” is shown as a preview here and in every app. Nothing is saved yet.',
    description: 'Message after a theme preview starts.',
  },
  previewTitle: { id: 'design-tokens.themes.preview.title', defaultMessage: 'Previewing the theme “{name}”', description: 'Heading of the bar shown while a theme is previewed.' },
  previewText: {
    id: 'design-tokens.themes.preview.text',
    defaultMessage: 'This page and every app show it for light and dark screens, but nothing is saved. Everyone who opens the apps sees it until you apply or discard it.',
    description: 'Text of the bar shown while a theme is previewed.',
  },
  previewBack: { id: 'design-tokens.themes.preview.back', defaultMessage: 'Back to editing', description: 'Button that opens the theme form again with the previewed values.' },
  previewDiscard: { id: 'design-tokens.themes.preview.discard', defaultMessage: 'Discard preview', description: 'Button that ends the theme preview without saving.' },
  previewDiscarded: {
    id: 'design-tokens.themes.preview.discarded',
    defaultMessage: 'The theme preview has ended. Nothing was saved.',
    description: 'Message after a theme preview was discarded.',
  },
  previewSaveUse: { id: 'design-tokens.themes.preview.save-use', defaultMessage: 'Save and use', description: 'Button that saves the previewed changes of a theme and applies it.' },

  // Sample
  sampleLight: { id: 'design-tokens.themes.sample.light', defaultMessage: 'Light', description: 'Label of the light screen sample of a theme.' },
  sampleDark: { id: 'design-tokens.themes.sample.dark', defaultMessage: 'Dark', description: 'Label of the dark screen sample of a theme.' },
  sampleHeading: { id: 'design-tokens.themes.sample.heading', defaultMessage: 'Course title', description: 'Sample heading in the preview of a theme.' },
  sampleText: {
    id: 'design-tokens.themes.sample.text',
    defaultMessage: 'Body text as learners read it on this screen.',
    description: 'Sample paragraph in the preview of a theme.',
  },
  sampleButton: { id: 'design-tokens.themes.sample.button', defaultMessage: 'Enroll', description: 'Sample primary button in the preview of a theme.' },
  sampleSecondary: { id: 'design-tokens.themes.sample.secondary', defaultMessage: 'Details', description: 'Sample secondary button in the preview of a theme.' },
  sampleLink: { id: 'design-tokens.themes.sample.link', defaultMessage: 'Link', description: 'Sample link in the preview of a theme.' },
  sampleBrand: { id: 'design-tokens.themes.sample.brand', defaultMessage: 'Brand', description: 'Sample brand badge in the preview of a theme.' },

  // Dialog
  createTitle: { id: 'design-tokens.themes.dialog.create.title', defaultMessage: 'Create a theme', description: 'Title of the form for a new theme.' },
  editTitle: { id: 'design-tokens.themes.dialog.edit.title', defaultMessage: 'Edit the theme “{name}”', description: 'Title of the form that edits a theme.' },
  dialogIntro: {
    id: 'design-tokens.themes.dialog.intro',
    defaultMessage: 'Only the colors that no other color is worked out from, for light and for dark screens, and the fonts: shades, hover colors and most components follow them. Status colors (success, warning, danger, info) and everything else stay as they are; change them in the design tokens afterwards.',
    description: 'Text at the top of the theme form.',
  },
  dialogInUse: {
    id: 'design-tokens.themes.dialog.in-use',
    defaultMessage: 'This theme is in use, so saving applies the new values to light and dark.',
    description: 'Note in the form of the theme that is applied.',
  },
  name: { id: 'design-tokens.themes.dialog.name', defaultMessage: 'Theme name', description: 'Label of the theme name field.' },
  nameRequired: { id: 'design-tokens.themes.dialog.name.required', defaultMessage: 'Give the theme a name.', description: 'Error when the theme name is empty.' },
  palettes: { id: 'design-tokens.themes.dialog.palettes', defaultMessage: 'Start from a palette', description: 'Label of the list of ready-made color palettes.' },
  palettesHelp: {
    id: 'design-tokens.themes.dialog.palettes.help',
    defaultMessage: 'Fills in the colors below. You can change each one afterwards.',
    description: 'Help text of the ready-made color palettes.',
  },
  colors: { id: 'design-tokens.themes.dialog.colors', defaultMessage: 'Colors', description: 'Heading of the color fields of the theme form.' },
  colorsHelp: {
    id: 'design-tokens.themes.dialog.colors.help',
    defaultMessage: 'Each color has a value for light screens and one for dark screens, so they can differ, for example a lighter link color on a dark background.',
    description: 'Help text under the Colors heading of the theme form.',
  },
  fonts: { id: 'design-tokens.themes.dialog.fonts', defaultMessage: 'Fonts', description: 'Heading of the font fields of the theme form.' },
  preview: { id: 'design-tokens.themes.dialog.preview', defaultMessage: 'How it looks', description: 'Heading of the live sample in the theme form.' },
  pickLight: {
    id: 'design-tokens.themes.dialog.pick-color.light',
    defaultMessage: 'Pick the {name} color for light screens',
    description: 'Accessible name of a light mode color picker. {name} is e.g. "Primary".',
  },
  pickDark: {
    id: 'design-tokens.themes.dialog.pick-color.dark',
    defaultMessage: 'Pick the {name} color for dark screens',
    description: 'Accessible name of a dark mode color picker. {name} is e.g. "Primary".',
  },
  hexLight: {
    id: 'design-tokens.themes.dialog.hex.light',
    defaultMessage: '{name} for light screens as a hex value',
    description: 'Accessible name of a light mode hex color field. {name} is e.g. "Primary".',
  },
  hexDark: {
    id: 'design-tokens.themes.dialog.hex.dark',
    defaultMessage: '{name} for dark screens as a hex value',
    description: 'Accessible name of a dark mode hex color field. {name} is e.g. "Primary".',
  },
  hexInvalid: { id: 'design-tokens.themes.dialog.hex.invalid', defaultMessage: 'Use a color like #1A59EA.', description: 'Error for a hex color field.' },
  contrastLabels: { id: 'design-tokens.themes.dialog.contrast.labels', defaultMessage: 'White button labels: {ratio}:1', description: 'Contrast of white text on this color. {ratio} is a number.' },
  contrastBackground: {
    id: 'design-tokens.themes.dialog.contrast.background',
    defaultMessage: 'On the page background: {ratio}:1',
    description: 'Contrast of this color on the page background of the same mode. {ratio} is a number.',
  },
  contrastSurface: {
    id: 'design-tokens.themes.dialog.contrast.surface',
    defaultMessage: 'On cards: {ratio}:1',
    description: 'Contrast of this color on the card background of the same mode. {ratio} is a number.',
  },
  contrastLow: { id: 'design-tokens.themes.dialog.contrast.low', defaultMessage: 'Hard to read: aim for 4.5:1 or more.', description: 'Warning under a low contrast ratio.' },
  submitCreate: { id: 'design-tokens.themes.dialog.submit.create', defaultMessage: 'Create and use', description: 'Button that makes and applies a new theme.' },
  submitCreateOnly: {
    id: 'design-tokens.themes.dialog.submit.create-only',
    defaultMessage: 'Create',
    description: 'Button that makes a new theme without applying it.',
  },
  createdOnly: {
    id: 'design-tokens.themes.created-only',
    defaultMessage: 'The theme “{name}” was created. Choose Use theme on its card when you want to apply it.',
    description: 'Message after a theme was made without applying it. {name} is the theme name.',
  },
  submitApply: { id: 'design-tokens.themes.dialog.submit.apply', defaultMessage: 'Save and apply', description: 'Button that saves the theme in use and applies it again.' },
  submitSave: { id: 'design-tokens.themes.dialog.submit.save', defaultMessage: 'Save theme', description: 'Button that saves a theme that is not in use.' },
  cancel: { id: 'design-tokens.themes.dialog.cancel', defaultMessage: 'Cancel', description: 'Button that closes the theme form without saving.' },

  // Colors of a theme (keys of THEME_COLORS in theme-template.js) and why each one matters
  primaryColor: { id: 'design-tokens.themes.color.primary', defaultMessage: 'Primary', description: 'Name of the primary color of a theme.' },
  primaryColorHelp: {
    id: 'design-tokens.themes.color.primary.help',
    defaultMessage: 'The main action color: solid buttons, focus outlines, selected tabs, checkboxes and progress bars; its lighter and darker shades and the hover colors follow it. Button labels stay white, so it has to be dark enough for white text.',
    description: 'Why the primary color matters.',
  },
  secondaryColor: { id: 'design-tokens.themes.color.secondary', defaultMessage: 'Secondary', description: 'Name of the secondary color of a theme.' },
  secondaryColorHelp: {
    id: 'design-tokens.themes.color.secondary.help',
    defaultMessage: 'Less prominent actions and accents: secondary buttons, badges and chips.',
    description: 'Why the secondary color matters.',
  },
  brandColor: { id: 'design-tokens.themes.color.brand', defaultMessage: 'Brand', description: 'Name of the brand color of a theme.' },
  brandColorHelp: {
    id: 'design-tokens.themes.color.brand.help',
    defaultMessage: 'Your organization’s signature color, for brand buttons, badges and other brand accents. When it is the same as the primary color, it keeps following the primary color.',
    description: 'Why the brand color matters.',
  },
  linkColor: { id: 'design-tokens.themes.color.link', defaultMessage: 'Links', description: 'Name of the link color of a theme.' },
  linkColorHelp: {
    id: 'design-tokens.themes.color.link.help',
    defaultMessage: 'Links in text and link buttons. Often different in dark mode: buttons need a primary dark enough for white labels, links need a color light enough to read on the dark background. When it is the same as the primary color, it keeps following the primary color.',
    description: 'Why the link color matters.',
  },
  backgroundColor: { id: 'design-tokens.themes.color.background', defaultMessage: 'Page background', description: 'Name of the page background color of a theme.' },
  backgroundColorHelp: {
    id: 'design-tokens.themes.color.background.help',
    defaultMessage: 'The background of every page, behind cards and content.',
    description: 'Why the page background color matters.',
  },
  surfaceColor: { id: 'design-tokens.themes.color.surface', defaultMessage: 'Card background', description: 'Name of the card background (surface) color of a theme.' },
  surfaceColorHelp: {
    id: 'design-tokens.themes.color.surface.help',
    defaultMessage: 'Cards, dialogs, dropdown menus, lists and data tables sit on this color. The same as the page background gives a flat look; a slightly different color makes cards stand out.',
    description: 'Why the card background color matters.',
  },
  textColor: { id: 'design-tokens.themes.color.text', defaultMessage: 'Body text', description: 'Name of the body text color of a theme.' },
  textColorHelp: {
    id: 'design-tokens.themes.color.text.help',
    defaultMessage: 'Paragraphs, labels, form fields and menus: all text except headings and links.',
    description: 'Why the body text color matters.',
  },
  headingsColor: { id: 'design-tokens.themes.color.headings', defaultMessage: 'Headings', description: 'Name of the headings color of a theme.' },
  headingsColorHelp: {
    id: 'design-tokens.themes.color.headings.help',
    defaultMessage: 'Page and section titles (h1 to h6), often a little stronger than the body text.',
    description: 'Why the headings color matters.',
  },
  borderColor: { id: 'design-tokens.themes.color.border', defaultMessage: 'Borders', description: 'Name of the border color of a theme.' },
  borderColorHelp: {
    id: 'design-tokens.themes.color.border.help',
    defaultMessage: 'Lines around cards, tables and other boxes, and dividers. Buttons and form fields keep their own borders.',
    description: 'Why the border color matters.',
  },

  // Fonts of a theme (keys of THEME_FONTS)
  body: { id: 'design-tokens.themes.font.body', defaultMessage: 'Body font', description: 'Name of the body font of a theme.' },
  bodyHelp: {
    id: 'design-tokens.themes.font.body.help',
    defaultMessage: 'Paragraphs, buttons, forms and menus: all text except headings.',
    description: 'What the body font is used for.',
  },
  headings: { id: 'design-tokens.themes.font.headings', defaultMessage: 'Headings font', description: 'Name of the headings font of a theme.' },
  headingsHelp: {
    id: 'design-tokens.themes.font.headings.help',
    defaultMessage: 'Page and section titles (h1 to h6).',
    description: 'What the headings font is used for.',
  },

  // Ready-made palettes
  paletteCode: { id: 'design-tokens.themes.palette.code', defaultMessage: 'Token files', description: 'Palette with the colors of the token files.' },
  paletteOcean: { id: 'design-tokens.themes.palette.ocean', defaultMessage: 'Ocean', description: 'Name of a blue color palette.' },
  paletteForest: { id: 'design-tokens.themes.palette.forest', defaultMessage: 'Forest', description: 'Name of a green color palette.' },
  paletteSunset: { id: 'design-tokens.themes.palette.sunset', defaultMessage: 'Sunset', description: 'Name of an orange color palette.' },
  paletteRoyal: { id: 'design-tokens.themes.palette.royal', defaultMessage: 'Royal', description: 'Name of a purple color palette.' },
  paletteTeal: { id: 'design-tokens.themes.palette.teal', defaultMessage: 'Teal', description: 'Name of a teal color palette.' },
  paletteGraphite: { id: 'design-tokens.themes.palette.graphite', defaultMessage: 'Graphite', description: 'Name of a gray color palette.' },

  // Font picker (theme form and the Edit form of font tokens)
  fontSystem: { id: 'design-tokens.fonts.group.system', defaultMessage: 'Fonts on every computer', description: 'Group of fonts that need no download.' },
  fontUploadedGroup: { id: 'design-tokens.fonts.group.uploaded', defaultMessage: 'Uploaded fonts', description: 'Group of fonts uploaded on this page.' },
  fontCurrent: { id: 'design-tokens.fonts.group.current', defaultMessage: 'Current value', description: 'Group with a font value that is not in the list.' },
  systemUi: { id: 'design-tokens.fonts.system-ui', defaultMessage: 'System font of the device', description: 'The operating system user interface font.' },
  upload: { id: 'design-tokens.fonts.upload', defaultMessage: 'Upload font', description: 'Button that uploads a font file.' },
  uploading: { id: 'design-tokens.fonts.uploading', defaultMessage: 'Uploading…', description: 'Upload font button while the file is sent.' },
  uploadAria: { id: 'design-tokens.fonts.upload.aria', defaultMessage: 'Upload a font file for {name}', description: 'Accessible name of the Upload font button.' },
  uploadHelp: {
    id: 'design-tokens.fonts.upload.help',
    defaultMessage: 'WOFF2, WOFF, TTF or OTF. The name, weight and style come from the file name, for example “OpenSans-BoldItalic.ttf”. Upload one file per weight.',
    description: 'Help text of the Upload font button.',
  },
  uploadFailed: {
    id: 'design-tokens.fonts.upload.failed',
    defaultMessage: 'The font could not be added. Use a WOFF2, WOFF, TTF or OTF file.',
    description: 'Error when a font file cannot be uploaded.',
  },
  uploaded: { id: 'design-tokens.fonts.uploaded', defaultMessage: 'Added the font “{name}”.', description: 'Message after a font file was uploaded. {name} is the font name.' },
});

export default messages;
