import { defineMessages } from 'react-intl';

const P = 'What a design token controls, used inside a sentence such as “Changes the {property} of Button”. Lower case.';

const messages = defineMessages({
  component: {
    id: 'design-tokens.describe.component',
    defaultMessage: 'Changes the {property} of {target}{state, select, hover { when the pointer is over it} active { while it is pressed} focus { when it has keyboard focus} disabled { when it is disabled} checked { when it is checked} selected { when it is selected} visited { after the link was visited} invalid { when its value is not valid} valid { when its value is valid} indeterminate { when only some items are selected} other {}}.',
    description: 'Description under a value in the edit form. {property} is what it controls, {target} the component, e.g. “Button (Solid primary)”.',
  },
  target: {
    id: 'design-tokens.describe.target',
    defaultMessage: '{component} ({variant})',
    description: 'A component with one of its styles, e.g. “Button (Solid primary)”.',
  },
  global: {
    id: 'design-tokens.describe.global',
    defaultMessage: 'Site-wide {property}.',
    description: 'Description under a global value in the edit form. {property} is what it controls.',
  },
  dependents: {
    id: 'design-tokens.describe.dependents',
    defaultMessage: 'Changing it also changes {count, plural, one {# value that follows it} other {# values that follow it}}: {sections}.',
    description: 'Under a value that other values copy. {sections} is a list of component names with counts.',
  },
  section: {
    id: 'design-tokens.describe.section',
    defaultMessage: '{name} ({count})',
    description: 'One item of the list of components that follow a value, with how many of their values follow it.',
  },
  more: {
    id: 'design-tokens.describe.more',
    defaultMessage: '{count, plural, one {# more} other {# more}}',
    description: 'Last item of a shortened list of components.',
  },
  direct: {
    id: 'design-tokens.describe.direct',
    defaultMessage: 'Components use this value directly.',
    description: 'Under a global value that no other value copies.',
  },

  background: { id: 'design-tokens.property.background', defaultMessage: 'background color', description: P },
  border: { id: 'design-tokens.property.border', defaultMessage: 'border color', description: P },
  text: { id: 'design-tokens.property.text', defaultMessage: 'text color', description: P },
  icon: { id: 'design-tokens.property.icon', defaultMessage: 'icon color', description: P },
  shadowColor: { id: 'design-tokens.property.shadow-color', defaultMessage: 'shadow color', description: P },
  underlineColor: { id: 'design-tokens.property.underline-color', defaultMessage: 'underline color', description: P },
  placeholder: { id: 'design-tokens.property.placeholder', defaultMessage: 'placeholder text color', description: P },
  color: { id: 'design-tokens.property.color', defaultMessage: 'color', description: P },
  radius: { id: 'design-tokens.property.radius', defaultMessage: 'corner roundness', description: P },
  borderWidth: { id: 'design-tokens.property.border-width', defaultMessage: 'border thickness', description: P },
  width: { id: 'design-tokens.property.width', defaultMessage: 'width', description: P },
  height: { id: 'design-tokens.property.height', defaultMessage: 'height', description: P },
  iconSize: { id: 'design-tokens.property.icon-size', defaultMessage: 'icon size', description: P },
  size: { id: 'design-tokens.property.size', defaultMessage: 'size', description: P },
  paddingX: { id: 'design-tokens.property.padding-x', defaultMessage: 'inner space at the sides', description: P },
  paddingY: { id: 'design-tokens.property.padding-y', defaultMessage: 'inner space at the top and bottom', description: P },
  padding: { id: 'design-tokens.property.padding', defaultMessage: 'inner space', description: P },
  marginX: { id: 'design-tokens.property.margin-x', defaultMessage: 'outer space at the sides', description: P },
  marginY: { id: 'design-tokens.property.margin-y', defaultMessage: 'outer space above and below', description: P },
  margin: { id: 'design-tokens.property.margin', defaultMessage: 'outer space', description: P },
  gap: { id: 'design-tokens.property.gap', defaultMessage: 'space between items', description: P },
  offset: { id: 'design-tokens.property.offset', defaultMessage: 'distance from the element it belongs to', description: P },
  spacing: { id: 'design-tokens.property.spacing', defaultMessage: 'spacing', description: P },
  font: { id: 'design-tokens.property.font', defaultMessage: 'font', description: P },
  fontSize: { id: 'design-tokens.property.font-size', defaultMessage: 'text size', description: P },
  fontWeight: { id: 'design-tokens.property.font-weight', defaultMessage: 'text boldness', description: P },
  lineHeight: { id: 'design-tokens.property.line-height', defaultMessage: 'space between lines of text', description: P },
  letterSpacing: { id: 'design-tokens.property.letter-spacing', defaultMessage: 'space between letters', description: P },
  underline: { id: 'design-tokens.property.underline', defaultMessage: 'text underline', description: P },
  textStyle: { id: 'design-tokens.property.text-style', defaultMessage: 'text style', description: P },
  stacking: { id: 'design-tokens.property.stacking', defaultMessage: 'stacking order (what shows on top)', description: P },
  shadow: { id: 'design-tokens.property.shadow', defaultMessage: 'shadow', description: P },
  animation: { id: 'design-tokens.property.animation', defaultMessage: 'animation', description: P },
  opacity: { id: 'design-tokens.property.opacity', defaultMessage: 'transparency', description: P },
  setting: { id: 'design-tokens.property.setting', defaultMessage: 'look', description: P },
});

export default messages;
