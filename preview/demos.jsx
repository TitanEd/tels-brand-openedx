/* One demo per component section, rendered with the real Paragon React components. */
import React, { useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  ActionRow, Alert, AlertModal, Annotation, Avatar, AvatarButton, Badge, Breadcrumb, Bubble, Button, ButtonGroup,
  ButtonToolbar, Card, CardGrid, CardView, Carousel, CheckboxControl, CheckboxFilter, Chip, ChipCarousel, CloseButton,
  Col, Collapsible, ColorPicker, Container, DataTable, Dropdown, DropdownButton, Dropzone, Figure, Form,
  FullscreenModal, Hyperlink, Icon, IconButton, IconButtonToggle, IconButtonWithTooltip, Image, InputGroup, Layout,
  MailtoLink, MarketingModal, Menu, MenuItem, ModalDialog, ModalPopup, MultiSelectDropdownFilter, Nav, Navbar,
  OverlayTrigger, PageBanner, Pagination, Popover, ProductTour, ProgressBar, Row as GridRow, Scrollable, SearchField,
  SelectableBox, SelectMenu, Sheet, Skeleton, Spinner, SplitButton, Stack, StandardModal, StatefulButton, Stepper,
  SwitchControl, Tab, Tabs, TextFilter, Toast, ToggleButton, ToggleButtonGroup, Tooltip, Truncate,
  breakpoints, useMediaQuery,
} from '@openedx/paragon';
import {
  Add, ArrowForward, Book, CheckCircle, Close, Delete, Download, Edit, Error as ErrorIcon, Favorite, Home, Info,
  Language, MoreVert, Notifications, Person, School, Search, Settings, Share, Star, Upload, Warning,
} from '@openedx/paragon/icons';
import m from './demos.messages';

const IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><rect width="600" height="300" fill="#9CA3AF"/>'
  + '<circle cx="300" cy="150" r="48" fill="#fff" opacity=".6"/></svg>',
)}`;
const noop = () => {};
// Breakpoints follow the window, but demos sit next to the sidebar: three cards per row only on wide screens.
const CARD_COLUMNS = { xs: 12, md: 6, xl: 4 };
const COLOR_VARIANTS = ['primary', 'secondary', 'brand', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
const STYLE = {
  primary: m.stylePrimary,
  secondary: m.styleSecondary,
  brand: m.styleBrand,
  success: m.styleSuccess,
  danger: m.styleDanger,
  warning: m.styleWarning,
  info: m.styleInfo,
  light: m.styleLight,
  dark: m.styleDark,
  tertiary: m.styleTertiary,
  error: m.styleError,
  black: m.styleBlack,
  default: m.styleDefault,
  accentA: m.styleAccentA,
  accentB: m.styleAccentB,
  reduced: m.styleReduced,
  minimal: m.styleMinimal,
};
const TOPICS = [m.topicMath, m.topicScience, m.topicHistory, m.topicArt, m.topicMusic, m.topicPhysics, m.topicBiology,
  m.topicChemistry, m.topicCoding];

function useText() {
  const intl = useIntl();
  const t = (message, values) => intl.formatMessage(message, values);
  t.style = (variant) => intl.formatMessage(STYLE[variant]);
  t.number = (value, options) => intl.formatNumber(value, options);
  return t;
}

export const Row = ({ children, dark }) => <div className={`preview-row${dark ? ' preview-dark-bar' : ''}`}>{children}</div>;
export const Label = ({ children }) => <div className="preview-label">{children}</div>;

// ---------------------------------------------------------------------------
// Step 1 — global demos
// ---------------------------------------------------------------------------

export function TypographySpecimen() {
  const t = useText();
  const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  return (
    <>
      {headings.map((Tag, i) => <Tag key={Tag}>{t(m.headingLevel, { level: t.number(i + 1) })}</Tag>)}
      <p className="display-1 mb-0">{t(m.display)}</p>
      <p className="lead">{t(m.lead)}</p>
      <p>
        {t(m.body, {
          b: (chunks) => <strong>{chunks}</strong>,
          i: (chunks) => <em>{chunks}</em>,
          small: (chunks) => <small>{chunks}</small>,
        })}
      </p>
      <p className="x-small">{t(m.extraSmall)}</p>
      <p style={{ fontFamily: 'var(--pgn-typography-font-family-monospace)' }}>
        {t(m.monospace, { sample: <bdi dir="ltr">const course = 101;</bdi> })}
      </p>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — component demos
// ---------------------------------------------------------------------------

export function TextDemo() {
  const t = useText();
  return (
    <>
      <h2>{t(m.pageHeading)}</h2>
      <p>{t(m.paragraph)}</p>
      <p className="text-muted">{t(m.muted)}</p>
      <ul><li>{t(m.listItem)}</li><li>{t(m.listItem)}</li></ul>
      <ol><li>{t(m.numberedItem)}</li><li>{t(m.numberedItem)}</li></ol>
    </>
  );
}

export function LinkDemo() {
  const t = useText();
  return (
    <Row>
      <a href="#top">{t(m.link)}</a>
      <Hyperlink destination="https://openedx.org" target="_blank" showLaunchIcon>{t(m.externalLink)}</Hyperlink>
      <Hyperlink destination="#top" variant="muted">{t(m.mutedLink)}</Hyperlink>
      <Hyperlink destination="#top" isInline>{t(m.inlineLink)}</Hyperlink>
      <MailtoLink to="support@example.com">support@example.com</MailtoLink>
    </Row>
  );
}

export function CodeDemo() {
  const t = useText();
  return (
    <p>
      {t(m.code, {
        code: <code dir="ltr">print(&quot;Hello&quot;)</code>,
        keys: <bdi dir="ltr"><kbd>{t(m.ctrlKey)}</kbd> + <kbd>S</kbd></bdi>,
      })}
    </p>
  );
}

export function ButtonDemo() {
  const t = useText();
  const [toggle, setToggle] = useState('day');
  const variants = [...COLOR_VARIANTS, 'tertiary'];
  const stateLabels = { default: t(m.save), pending: t(m.saving), complete: t(m.saved) };
  return (
    <>
      <Label>{t(m.solid)}</Label>
      <Row>{variants.map((v) => <Button key={v} variant={v}>{t.style(v)}</Button>)}</Row>
      <Label>{t(m.outline)}</Label>
      <Row>{variants.map((v) => <Button key={v} variant={`outline-${v}`}>{t.style(v)}</Button>)}</Row>
      <Label>{t(m.onDark)}</Label>
      <Row dark>{variants.map((v) => <Button key={v} variant={`inverse-${v}`}>{t.style(v)}</Button>)}</Row>
      <Label>{t(m.outlineOnDark)}</Label>
      <Row dark>{variants.map((v) => <Button key={v} variant={`inverse-outline-${v}`}>{t.style(v)}</Button>)}</Row>
      <Label>{t(m.moreButtons)}</Label>
      <Row>
        <Button variant="link">{t(m.linkButton)}</Button>
        <Button size="sm">{t(m.small)}</Button><Button>{t(m.medium)}</Button><Button size="lg">{t(m.large)}</Button>
        <Button iconBefore={Add}>{t(m.add)}</Button>
        <Button variant="outline-primary" iconAfter={ArrowForward}>{t(m.continue)}</Button>
        <Button disabled>{t(m.disabled)}</Button>
        <Button variant="outline-primary" disabled>{t(m.disabledOutline)}</Button>
      </Row>
      <Button block className="mb-3">{t(m.fullWidth)}</Button>
      <Label>{t(m.groups)}</Label>
      <Row>
        <ButtonGroup>
          <Button variant="outline-primary">{t(m.first)}</Button>
          <Button variant="outline-primary">{t(m.second)}</Button>
          <Button variant="outline-primary">{t(m.third)}</Button>
        </ButtonGroup>
        <ButtonToolbar>
          <ButtonGroup style={{ marginInlineEnd: '.5rem' }}>
            <Button>{t.number(1)}</Button><Button>{t.number(2)}</Button>
          </ButtonGroup>
          <ButtonGroup><Button variant="secondary">{t.number(3)}</Button></ButtonGroup>
        </ButtonToolbar>
        <ToggleButtonGroup type="radio" name="toggle" value={toggle} onChange={setToggle}>
          <ToggleButton id="tb-day" value="day" variant="outline-primary">{t(m.day)}</ToggleButton>
          <ToggleButton id="tb-week" value="week" variant="outline-primary">{t(m.week)}</ToggleButton>
        </ToggleButtonGroup>
        <StatefulButton state="default" labels={stateLabels} />
        <StatefulButton state="pending" labels={stateLabels} disabledStates={['pending']} />
        <StatefulButton state="complete" variant="success" labels={stateLabels} />
      </Row>
    </>
  );
}

export function IconButtonDemo() {
  const t = useText();
  const [active, setActive] = useState('list');
  return (
    <>
      <Row>
        {['primary', 'secondary', 'brand', 'success', 'warning', 'danger', 'light', 'dark', 'black'].map((v) => (
          <IconButton key={v} src={Edit} iconAs={Icon} alt={t(m.editStyle, { style: t.style(v) })} variant={v} />
        ))}
        <IconButton src={Favorite} iconAs={Icon} alt={t(m.favorite)} variant="primary" isActive />
        <IconButton src={Settings} iconAs={Icon} alt={t(m.settings)} size="sm" />
        <IconButton src={Delete} iconAs={Icon} alt={t(m.delete)} size="inline" />
      </Row>
      <Row dark>
        {['primary', 'secondary', 'light', 'dark'].map((v) => (
          <IconButton key={v} src={Share} iconAs={Icon} alt={t(m.shareStyle, { style: t.style(v) })} variant={v} invertColors />
        ))}
      </Row>
      <Row>
        <IconButtonToggle activeValue={active} onChange={setActive}>
          <IconButtonWithTooltip value="list" src={Book} iconAs={Icon} alt={t(m.listView)} tooltipContent={t(m.listView)} tooltipPlacement="top" />
          <IconButtonWithTooltip value="grid" src={School} iconAs={Icon} alt={t(m.gridView)} tooltipContent={t(m.gridView)} tooltipPlacement="top" />
        </IconButtonToggle>
      </Row>
    </>
  );
}

export function IconDemo() {
  return (
    <Row>
      {[Home, Info, Warning, ErrorIcon, CheckCircle, Notifications, Person, Language, Star, Download, Upload].map((src, i) => (
        <Icon key={i} src={src} />
      ))}
      <Icon src={Star} className="text-primary" size="lg" />
      <Icon src={Star} size="sm" />
    </Row>
  );
}

export function CloseButtonDemo() {
  const t = useText();
  return (
    <Row>
      <CloseButton aria-label={t(m.close)} />
      <span className="preview-dark-bar"><IconButton src={Close} iconAs={Icon} alt={t(m.close)} variant="light" invertColors /></span>
    </Row>
  );
}

export function DropdownDemo() {
  const t = useText();
  return (
    <>
      <Row>
        <Dropdown>
          <Dropdown.Toggle id="dd-1" variant="primary">{t(m.actions)}</Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Header>{t(m.sectionTitle)}</Dropdown.Header>
            <Dropdown.Item href="#top">{t(m.action)}</Dropdown.Item>
            <Dropdown.Item href="#top" active>{t(m.selectedItem)}</Dropdown.Item>
            <Dropdown.Item href="#top" disabled>{t(m.disabledItem)}</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item href="#top">{t(m.itemAfterDivider)}</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <DropdownButton id="dd-2" title={t(m.moreOptions)} variant="outline-primary">
          <Dropdown.Item href="#top">{t(m.option, { number: t.number(1) })}</Dropdown.Item>
          <Dropdown.Item href="#top">{t(m.option, { number: t.number(2) })}</Dropdown.Item>
        </DropdownButton>
        <SplitButton id="dd-3" title={t(m.splitAction)} variant="secondary">
          <Dropdown.Item href="#top">{t(m.option, { number: t.number(1) })}</Dropdown.Item>
          <Dropdown.Item href="#top">{t(m.option, { number: t.number(2) })}</Dropdown.Item>
        </SplitButton>
        <Dropdown>
          <Dropdown.Toggle id="dd-4" as={IconButton} src={MoreVert} iconAs={Icon} variant="primary" alt={t(m.moreActions)} />
          <Dropdown.Menu>
            <Dropdown.Item href="#top">{t(m.edit)}</Dropdown.Item>
            <Dropdown.Item href="#top">{t(m.delete)}</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Row>
      <Label>{t(m.openMenu)}</Label>
      <div className="dropdown-menu show position-static">
        <span className="dropdown-header">{t(m.sectionTitle)}</span>
        <a className="dropdown-item" href="#top">{t(m.item)}</a>
        <a className="dropdown-item active" href="#top">{t(m.selectedItem)}</a>
        <a className="dropdown-item disabled" href="#top">{t(m.disabledItem)}</a>
      </div>
    </>
  );
}

export function MenuDemo() {
  const t = useText();
  return (
    <Row>
      <Menu>
        <MenuItem iconBefore={Person}>{t(m.profile)}</MenuItem>
        <MenuItem>{t(m.menuItem)}</MenuItem>
        <MenuItem disabled>{t(m.disabled)}</MenuItem>
      </Menu>
      <SelectMenu defaultMessage={t(m.chooseOption)}>
        {[1, 2, 3].map((n) => <MenuItem key={n}>{t(m.option, { number: t.number(n) })}</MenuItem>)}
      </SelectMenu>
    </Row>
  );
}

export function AlertDemo() {
  const t = useText();
  return [['success', CheckCircle], ['info', Info], ['warning', Warning], ['danger', ErrorIcon], ['light', Info], ['dark', Info]].map(([v, icon]) => (
    <Alert key={v} variant={v} icon={icon} dismissible onClose={noop} actions={[<Button key="a">{t(m.action)}</Button>]}>
      <Alert.Heading>{t(m.alertHeading, { style: t.style(v) })}</Alert.Heading>
      <p>{t(m.alertText, { a: (chunks) => <Alert.Link href="#top">{chunks}</Alert.Link> })}</p>
    </Alert>
  ));
}

export function PageBannerDemo() {
  const t = useText();
  return ['light', 'dark', 'warning', 'accentA', 'accentB'].map((v) => (
    <PageBanner key={v} variant={v} dismissible onDismiss={noop} show>
      {t(m.bannerText, { style: t.style(v) })}{' '}<a href="#top">{t(m.learnMore)}</a>
    </PageBanner>
  ));
}

export function ToastDemo() {
  const t = useText();
  const [show, setShow] = useState(false);
  return (
    <Row>
      <Button variant="outline-primary" onClick={() => setShow(true)}>{t(m.showToast)}</Button>
      <Toast show={show} onClose={() => setShow(false)} action={{ label: t(m.undo), onClick: () => setShow(false) }}>
        {t(m.toastText)}
      </Toast>
    </Row>
  );
}

export function BadgeDemo() {
  const t = useText();
  return <Row>{COLOR_VARIANTS.map((v) => <Badge key={v} variant={v}>{t.style(v)}</Badge>)}</Row>;
}

export function BubbleDemo() {
  const t = useText();
  return (
    <Row>
      {['primary', 'success', 'warning', 'error'].map((v) => <Bubble key={v} variant={v}>{t.number(3)}</Bubble>)}
      <Bubble disabled>{t.number(9)}</Bubble>
    </Row>
  );
}

export function ChipDemo() {
  const t = useText();
  return (
    <>
      <Row>
        <Chip>{t(m.chip)}</Chip>
        <Chip iconBefore={Person}>{t(m.withIcon)}</Chip>
        <Chip iconAfter={Close} onIconAfterClick={noop} iconAfterAlt={t(m.remove)}>{t(m.removable)}</Chip>
        <Chip isSelected>{t(m.selected)}</Chip>
        <Chip disabled>{t(m.disabled)}</Chip>
      </Row>
      <Row dark>
        <Chip variant="dark">{t(m.darkChip)}</Chip>
        <Chip variant="dark" iconBefore={Star} isSelected>{t(m.darkSelected)}</Chip>
      </Row>
      <ChipCarousel ariaLabel={t(m.topics)} items={TOPICS.map((topic) => <Chip key={topic.id}>{t(topic)}</Chip>)} />
    </>
  );
}

export function AnnotationDemo() {
  const t = useText();
  return (
    <Row>
      {['success', 'warning', 'error', 'light', 'dark'].map((v) => (
        <Annotation key={v} variant={v} arrowPlacement="bottom">{t(m.annotation, { style: t.style(v) })}</Annotation>
      ))}
    </Row>
  );
}

export function CardDemo() {
  const t = useText();
  const isSmall = useMediaQuery({ maxWidth: breakpoints.small.maxWidth });
  return (
    <>
      <CardGrid columnSizes={CARD_COLUMNS}>
        <Card isClickable>
          <Card.ImageCap src={IMAGE} srcAlt={t(m.courseImage)} logoSrc={IMAGE} logoAlt={t(m.orgLogo)} />
          <Card.Header
            title={t(m.courseTitle)}
            subtitle={t(m.orgUniversity)}
            actions={<IconButton src={MoreVert} iconAs={Icon} alt={t(m.moreActions)} />}
          />
          <Card.Section>{t(m.cardText)}</Card.Section>
          <Card.Footer><Button>{t(m.enroll)}</Button><Button variant="outline-primary">{t(m.details)}</Button></Card.Footer>
        </Card>
        <Card variant="muted">
          <Card.Header title={t(m.mutedCard)} />
          <Card.Section>{t(m.mutedCardText)}</Card.Section>
          <Card.Status variant="warning" icon={Warning} title={t(m.status)}>{t(m.statusText)}</Card.Status>
          <Card.Footer><Button variant="tertiary">{t(m.details)}</Button></Card.Footer>
        </Card>
        <Card variant="dark">
          <Card.Header title={t(m.darkCard)} subtitle={t(m.darkCardSubtitle)} />
          <Card.Section>{t(m.darkCardText)}</Card.Section>
          <Card.Footer><Button variant="inverse-primary">{t(m.action)}</Button></Card.Footer>
        </Card>
      </CardGrid>
      <Card orientation={isSmall ? 'vertical' : 'horizontal'} className="mb-3">
        <Card.ImageCap src={IMAGE} srcAlt={t(m.courseImage)} />
        <Card.Body>
          <Card.Header title={t(m.horizontalCard)} />
          <Card.Section>{t(m.horizontalText)}</Card.Section>
        </Card.Body>
      </Card>
      <Card isLoading><Card.Header title={t(m.loading)} /><Card.Section>{t(m.loadingCard)}</Card.Section></Card>
    </>
  );
}

export function FormDemo() {
  const t = useText();
  const [checked, setChecked] = useState(true);
  return (
    <div className="preview-grid">
      <div>
        <Form.Group controlId="f-email">
          <Form.Label>{t(m.email)}</Form.Label>
          <Form.Control type="email" placeholder={t(m.emailPlaceholder)} />
          <Form.Text>{t(m.helpText)}</Form.Text>
        </Form.Group>
        <Form.Group controlId="f-float"><Form.Control floatingLabel={t(m.floatingLabel)} /></Form.Group>
        <Form.Group controlId="f-icon">
          <Form.Control placeholder={t(m.withIcons)} leadingElement={<Icon src={Search} />} trailingElement={<Icon src={Close} />} />
        </Form.Group>
        <Form.Group controlId="f-invalid" isInvalid>
          <Form.Label>{t(m.invalid)}</Form.Label>
          <Form.Control defaultValue={t(m.wrongValue)} />
          <Form.Control.Feedback type="invalid">{t(m.errorMessage)}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="f-valid" isValid>
          <Form.Label>{t(m.valid)}</Form.Label>
          <Form.Control defaultValue={t(m.correctValue)} />
          <Form.Control.Feedback type="valid">{t(m.looksGood)}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="f-disabled">
          <Form.Label>{t(m.disabled)}</Form.Label>
          <Form.Control disabled defaultValue={t(m.disabled)} />
        </Form.Group>
      </div>
      <div>
        <Form.Group controlId="f-select">
          <Form.Label>{t(m.list)}</Form.Label>
          <Form.Control as="select">
            <option>{t(m.option, { number: t.number(1) })}</option>
            <option>{t(m.option, { number: t.number(2) })}</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="f-textarea"><Form.Label>{t(m.textArea)}</Form.Label><Form.Control as="textarea" rows={3} /></Form.Group>
        <Form.Group>
          <Form.Label>{t(m.addOns)}</Form.Label>
          <InputGroup>
            <InputGroup.Prepend><InputGroup.Text>@</InputGroup.Text></InputGroup.Prepend>
            <Form.Control placeholder={t(m.username)} aria-label={t(m.username)} />
            <InputGroup.Append><Button variant="outline-primary">{t(m.go)}</Button></InputGroup.Append>
          </InputGroup>
        </Form.Group>
        <Form.Group>
          <Form.Label>{t(m.suggestions)}</Form.Label>
          <Form.Autosuggest placeholder={t(m.typeTopic)} helpMessage={t(m.selectOne)} onChange={noop}>
            {TOPICS.slice(0, 3).map((topic) => <Form.AutosuggestOption key={topic.id}>{t(topic)}</Form.AutosuggestOption>)}
          </Form.Autosuggest>
        </Form.Group>
      </div>
      <div>
        <Form.Group>
          <Form.Label>{t(m.checkboxes)}</Form.Label>
          <Form.CheckboxSet name="cb" defaultValue={['a']}>
            <Form.Checkbox value="a">{t(m.checked)}</Form.Checkbox>
            <Form.Checkbox value="b">{t(m.unchecked)}</Form.Checkbox>
            <Form.Checkbox value="c" disabled>{t(m.disabled)}</Form.Checkbox>
            <Form.Checkbox value="d" isInvalid>{t(m.invalid)}</Form.Checkbox>
          </Form.CheckboxSet>
        </Form.Group>
        <Form.Group>
          <Form.Label>{t(m.radios)}</Form.Label>
          <Form.RadioSet name="rd" defaultValue="a">
            <Form.Radio value="a">{t(m.selected)}</Form.Radio>
            <Form.Radio value="b">{t(m.notSelected)}</Form.Radio>
            <Form.Radio value="c" disabled>{t(m.disabled)}</Form.Radio>
          </Form.RadioSet>
        </Form.Group>
        <Form.Group>
          <Form.Label className="d-block">{t(m.switches)}</Form.Label>
          <Stack gap={2} className="align-items-start">
            <Form.Switch defaultChecked>{t(m.on)}</Form.Switch>
            <Form.Switch>{t(m.off)}</Form.Switch>
          </Stack>
        </Form.Group>
        <Form.Group>
          <Form.Label className="d-block">{t(m.noLabel)}</Form.Label>
          <Row>
            <CheckboxControl checked={checked} onChange={() => setChecked(!checked)} aria-label={t(m.rowSelected)} />
            <CheckboxControl isIndeterminate aria-label={t(m.someRows)} />
            <SwitchControl checked={checked} onChange={() => setChecked(!checked)} aria-label={t(m.enabled)} />
          </Row>
        </Form.Group>
      </div>
    </div>
  );
}

export function SearchFieldDemo() {
  const t = useText();
  return (
    <div style={{ maxWidth: 480 }}>
      <SearchField onSubmit={noop} placeholder={t(m.search)} />
      <div className="mt-3">
        <SearchField onSubmit={noop} placeholder={t(m.searchWithButton)} submitButtonLocation="external" />
      </div>
    </div>
  );
}

export function SelectableBoxDemo() {
  const t = useText();
  const [plan, setPlan] = useState('b');
  const price = (value) => (value ? t.number(value, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : t(m.free));
  const plans = [['a', m.planBasic, 0], ['b', m.planPro, 10], ['c', m.planTeam, 30]];
  return (
    <SelectableBox.Set name="plans" value={plan} onChange={(e) => setPlan(e.target.value)} type="radio" columns={3} ariaLabel={t(m.plans)}>
      {plans.map(([value, name, amount]) => (
        <SelectableBox key={value} value={value} type="radio" aria-label={t(name)}>
          <h5>{t(name)}</h5><p>{price(amount)}</p>
        </SelectableBox>
      ))}
    </SelectableBox.Set>
  );
}

export function DropzoneDemo() {
  return <Dropzone onProcessUpload={noop} accept={{ 'image/*': [] }} />;
}

export function ColorPickerDemo() {
  const [color, setColor] = useState('#EB5939');
  return <ColorPicker color={color} setColor={setColor} />;
}

export function TabsDemo() {
  const t = useText();
  const styles = [['tabs', m.styleTabs], ['pills', m.stylePills], ['button-group', m.styleButtonGroup]];
  return (
    <>
      {styles.map(([variant, name]) => (
        <div key={variant} className="mb-3">
          <Label>{t(name)}</Label>
          <Tabs variant={variant} defaultActiveKey="one" id={`tabs-${variant}`}>
            <Tab eventKey="one" title={t(m.selectedTab)}><p className="mt-2">{t(m.selectedTabText)}</p></Tab>
            <Tab eventKey="two" title={t(m.otherTab)}><p className="mt-2">{t(m.otherTabText)}</p></Tab>
            <Tab eventKey="three" title={t(m.disabled)} disabled />
          </Tabs>
        </div>
      ))}
      <Label>{t(m.onDark)}</Label>
      <Row dark>
        {['inverse-tabs', 'inverse-pills'].map((variant) => (
          <Tabs key={variant} variant={variant} defaultActiveKey="one" id={`tabs-${variant}`}>
            <Tab eventKey="one" title={t(m.selectedTab)} /><Tab eventKey="two" title={t(m.otherTab)} />
          </Tabs>
        ))}
      </Row>
      <Label>{t(m.navPills)}</Label>
      <Nav variant="pills" defaultActiveKey="a">
        <Nav.Item><Nav.Link eventKey="a">{t(m.active)}</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="b">{t(m.link)}</Nav.Link></Nav.Item>
        <Nav.Item><Nav.Link eventKey="c" disabled>{t(m.disabled)}</Nav.Link></Nav.Item>
      </Nav>
    </>
  );
}

export function BreadcrumbDemo() {
  const t = useText();
  return (
    <>
      <Breadcrumb
        ariaLabel={t(m.breadcrumb)}
        links={[{ label: t(m.home), href: '#top' }, { label: t(m.courses), href: '#top' }]}
        activeLabel={t(m.currentPage)}
      />
      <Row dark>
        <Breadcrumb ariaLabel={t(m.breadcrumb)} variant="dark" links={[{ label: t(m.home), href: '#top' }]} activeLabel={t(m.currentPage)} />
      </Row>
    </>
  );
}

export function PaginationDemo() {
  const t = useText();
  return (
    <>
      {['default', 'secondary', 'reduced', 'minimal'].map((variant) => (
        <Pagination
          key={variant} variant={variant} paginationLabel={t(m.pagination, { style: t.style(variant) })}
          pageCount={12} currentPage={3} onPageSelect={noop} className="mb-2"
        />
      ))}
      <Row dark>
        <Pagination invertColors paginationLabel={t(m.pagination, { style: t(m.onDark) })} pageCount={5} currentPage={2} onPageSelect={noop} />
      </Row>
    </>
  );
}

export function NavbarDemo() {
  const t = useText();
  const links = (
    <Nav style={{ marginInlineEnd: 'auto' }}>
      <Nav.Link href="#top" active>{t(m.courses)}</Nav.Link>
      <Nav.Link href="#top">{t(m.programs)}</Nav.Link>
    </Nav>
  );
  return (
    <>
      <Navbar bg="light" expand="md" className="mb-2">
        <Navbar.Brand href="#top">{t(m.siteName)}</Navbar.Brand>
        {links}
      </Navbar>
      <Navbar bg="dark" variant="dark" expand="md">
        <Navbar.Brand href="#top">{t(m.siteName)}</Navbar.Brand>
        {links}
      </Navbar>
    </>
  );
}

export function StepperDemo() {
  const t = useText();
  return (
    <Stepper activeKey="review">
      <Stepper.Header />
      <Stepper.Step eventKey="details" title={t(m.details)}>{t(m.stepText)}</Stepper.Step>
      <Stepper.Step eventKey="review" title={t(m.review)} description={t(m.currentStep)}>{t(m.stepText)}</Stepper.Step>
      <Stepper.Step eventKey="done" title={t(m.done)} hasError>{t(m.stepText)}</Stepper.Step>
    </Stepper>
  );
}

export function TooltipDemo() {
  const t = useText();
  return (
    <Row>
      <Tooltip id="tt-static" placement="top" className="show position-relative">{t(m.tooltip)}</Tooltip>
      <Tooltip id="tt-static-light" placement="top" variant="light" className="show position-relative">{t(m.lightTooltip)}</Tooltip>
      <OverlayTrigger placement="top" overlay={<Tooltip id="tt-1">{t(m.tooltipOnHover)}</Tooltip>}>
        <Button variant="outline-primary">{t(m.pointHere)}</Button>
      </OverlayTrigger>
    </Row>
  );
}

export function PopoverDemo() {
  const t = useText();
  const content = (
    <Popover id="po-1">
      <Popover.Title as="h3">{t(m.popoverTitle)}</Popover.Title>
      <Popover.Content>{t(m.clickAgain)}</Popover.Content>
    </Popover>
  );
  return (
    <Row>
      <Popover id="po-static" placement="bottom" className="position-relative">
        <Popover.Title as="h3">{t(m.popoverTitle)}</Popover.Title>
        <Popover.Content>{t(m.popoverText)}</Popover.Content>
      </Popover>
      <OverlayTrigger trigger="click" placement="bottom" overlay={content}>
        <Button variant="outline-primary">{t(m.clickHere)}</Button>
      </OverlayTrigger>
    </Row>
  );
}

export function ProductTourDemo() {
  const t = useText();
  const [enabled, setEnabled] = useState(false);
  const tour = {
    tourId: 'preview-tour',
    enabled,
    advanceButtonText: t(m.next),
    backButtonText: t(m.back),
    endButtonText: t(m.done),
    onDismiss: () => setEnabled(false),
    onEnd: () => setEnabled(false),
    checkpoints: [
      { target: '#tour-step-1', title: t(m.yourCourses), body: t(m.yourCoursesText), placement: 'bottom' },
      { target: '#tour-step-2', title: t(m.progress), body: t(m.progressText), placement: 'bottom' },
    ],
  };
  return (
    <>
      <ProductTour tours={[tour]} />
      <Row>
        <Button onClick={() => setEnabled(true)}>{t(m.startTour)}</Button>
        <span id="tour-step-1" className="p-2 border rounded">{t(m.firstStep)}</span>
        <span id="tour-step-2" className="p-2 border rounded">{t(m.secondStep)}</span>
      </Row>
    </>
  );
}

export function ModalDemo() {
  const t = useText();
  const [modal, setModal] = useState(null);
  const [popup, setPopup] = useState(false);
  const popupRef = useRef(null);
  const close = () => setModal(null);
  const footer = (
    <ActionRow>
      <ActionRow.Spacer />
      <Button variant="tertiary" onClick={close}>{t(m.cancel)}</Button>
      <Button onClick={close}>{t(m.save)}</Button>
    </ActionRow>
  );
  const dialogStyles = ['default', 'warning', 'danger', 'success', 'dark'];
  return (
    <>
      <Row>
        {dialogStyles.map((v) => (
          <Button key={v} variant="outline-primary" onClick={() => setModal(`dialog-${v}`)}>{t(m.dialogStyle, { style: t.style(v) })}</Button>
        ))}
        <Button variant="outline-primary" onClick={() => setModal('standard')}>{t(m.standardDialog)}</Button>
        <Button variant="outline-primary" onClick={() => setModal('alert')}>{t(m.alertDialog)}</Button>
        <Button variant="outline-primary" onClick={() => setModal('fullscreen')}>{t(m.fullscreenDialog)}</Button>
        <Button variant="outline-primary" onClick={() => setModal('marketing')}>{t(m.promoDialog)}</Button>
        <Button variant="outline-primary" ref={popupRef} onClick={() => setPopup(true)}>{t(m.popup)}</Button>
      </Row>
      {dialogStyles.map((v) => (
        <ModalDialog
          key={v} title={t(m.dialogStyle, { style: t.style(v) })} isOpen={modal === `dialog-${v}`} onClose={close} variant={v}
          hasCloseButton
        >
          <ModalDialog.Header><ModalDialog.Title>{t(m.dialogStyle, { style: t.style(v) })}</ModalDialog.Title></ModalDialog.Header>
          <ModalDialog.Body><p>{t(m.dialogText)}</p><Form.Control placeholder={t(m.fieldInDialog)} /></ModalDialog.Body>
          <ModalDialog.Footer>
            <ActionRow>
              <ModalDialog.CloseButton variant="tertiary">{t(m.cancel)}</ModalDialog.CloseButton>
              <Button onClick={close}>{t(m.ok)}</Button>
            </ActionRow>
          </ModalDialog.Footer>
        </ModalDialog>
      ))}
      <StandardModal title={t(m.standardDialog)} isOpen={modal === 'standard'} onClose={close} footerNode={footer} hasCloseButton>
        <p>{t(m.dialogText)}</p>
      </StandardModal>
      <AlertModal title={t(m.alertDialog)} isOpen={modal === 'alert'} onClose={close} footerNode={footer}>
        <p>{t(m.areYouSure)}</p>
      </AlertModal>
      <FullscreenModal title={t(m.fullscreenDialog)} isOpen={modal === 'fullscreen'} onClose={close} footerNode={footer}>
        <p>{t(m.dialogText)}</p>
      </FullscreenModal>
      <MarketingModal
        title={t(m.promoDialog)} isOpen={modal === 'marketing'} onClose={close} footerNode={footer}
        heroNode={<div className="p-4 bg-primary text-white"><h2>{t(m.specialOffer)}</h2></div>}
      >
        <p>{t(m.dialogText)}</p>
      </MarketingModal>
      <ModalPopup positionRef={popupRef} isOpen={popup} onClose={() => setPopup(false)}>
        <div className="bg-white p-3 rounded shadow border">{t(m.popupText)}</div>
      </ModalPopup>
    </>
  );
}

export function SheetDemo() {
  const t = useText();
  const [sheet, setSheet] = useState(false);
  return (
    <>
      <Button variant="outline-primary" onClick={() => setSheet(true)}>{t(m.openPanel)}</Button>
      <Sheet position="right" show={sheet} onClose={() => setSheet(false)} blocking={false}>
        <h4>{t(m.panelTitle)}</h4><p>{t(m.panelText)}</p><Button onClick={() => setSheet(false)}>{t(m.close)}</Button>
      </Sheet>
    </>
  );
}

const TABLE_ROWS = [
  [m.courseDataScience, m.orgUniversity, 1200, m.statusActive],
  [m.courseDesign, m.orgInstitute, 830, m.statusActive],
  [m.coursePhysics, m.orgCollege, 2400, m.statusArchived],
  [m.courseMachineLearning, m.orgAcademy, 5100, m.statusActive],
  [m.courseWriting, m.orgInstitute, 310, m.statusDraft],
  [m.courseStatistics, m.orgUniversity, 990, m.statusActive],
  [m.courseBiology, m.orgCollege, 1470, m.statusArchived],
];

function CourseCard({ className, original }) {
  const t = useText();
  return (
    <Card className={className}>
      <Card.Header title={original.name} subtitle={original.org} />
      <Card.Section>{t(m.learnersStatus, { count: original.learners, status: original.status })}</Card.Section>
    </Card>
  );
}

export function DataTableDemo() {
  const t = useText();
  const intl = useIntl();
  const data = useMemo(() => TABLE_ROWS.map(([name, org, learners, status]) => ({
    name: intl.formatMessage(name), org: intl.formatMessage(org), learners, status: intl.formatMessage(status),
  })), [intl]);
  const columns = useMemo(() => {
    const choices = (list) => list.map((message) => {
      const text = intl.formatMessage(message);
      return { name: text, value: text };
    });
    return [
      { Header: intl.formatMessage(m.course), accessor: 'name' },
      {
        Header: intl.formatMessage(m.organization), accessor: 'org', Filter: CheckboxFilter, filter: 'includesValue',
        filterChoices: choices([m.orgUniversity, m.orgInstitute, m.orgCollege, m.orgAcademy]),
      },
      {
        Header: intl.formatMessage(m.learners), accessor: 'learners', disableFilters: true,
        Cell: ({ value }) => intl.formatNumber(value),
      },
      {
        Header: intl.formatMessage(m.status), accessor: 'status', Filter: MultiSelectDropdownFilter, filter: 'includesValue',
        filterChoices: choices([m.statusActive, m.statusArchived, m.statusDraft]),
      },
    ];
  }, [intl]);
  return (
    <>
      <DataTable
        itemCount={data.length} data={data} columns={columns}
        isSortable isPaginated isSelectable isFilterable defaultColumnValues={{ Filter: TextFilter }}
        initialState={{ pageSize: 5, pageIndex: 0 }}
      >
        <DataTable.TableControlBar />
        <DataTable.Table />
        <DataTable.EmptyTable content={t(m.noResults)} />
        <DataTable.TableFooter />
      </DataTable>
      <Label>{t(m.cardView)}</Label>
      <DataTable itemCount={3} data={data.slice(0, 3)} columns={columns}>
        <CardView CardComponent={CourseCard} columnSizes={CARD_COLUMNS} />
      </DataTable>
      <Label>{t(m.simpleTable)}</Label>
      <table className="table table-striped table-bordered table-hover">
        <thead><tr><th>{t(m.course)}</th><th>{t(m.learners)}</th></tr></thead>
        <tbody>{data.slice(0, 3).map((r) => <tr key={r.name}><td>{r.name}</td><td>{t.number(r.learners)}</td></tr>)}</tbody>
      </table>
    </>
  );
}

export function SpinnerDemo() {
  const t = useText();
  return (
    <Row>
      <Spinner animation="border" screenReaderText={t(m.loading)} />
      {['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].map((v) => (
        <Spinner key={v} animation="border" variant={v} size="sm" screenReaderText={t(m.loading)} />
      ))}
      <Spinner animation="grow" variant="primary" screenReaderText={t(m.loading)} />
    </Row>
  );
}

export function ProgressBarDemo() {
  const t = useText();
  const percent = (value) => t.number(value / 100, { style: 'percent' });
  return (
    <>
      <ProgressBar now={20} label={percent(20)} className="mb-2" />
      {['success', 'warning', 'error', 'dark'].map((v, i) => (
        <ProgressBar key={v} now={35 + i * 15} label={percent(35 + i * 15)} variant={v} className="mb-2" />
      ))}
      <ProgressBar.Annotated
        now={60} label={percent(60)} variant="dark" threshold={80} thresholdLabel={percent(80)}
        progressHint={t(m.yourProgress)} thresholdHint={t(m.passingGrade)}
      />
    </>
  );
}

export function SkeletonDemo() {
  return <Skeleton count={3} />;
}

export function CollapsibleDemo() {
  const t = useText();
  return (
    <div className="preview-grid">
      <Collapsible title={t(m.styleCard)} styling="card" defaultOpen>{t(m.collapsibleText)}</Collapsible>
      <Collapsible title={t(m.styleLargeCard)} styling="card-lg">{t(m.collapsibleText)}</Collapsible>
      <Collapsible title={t(m.styleBasic)} styling="basic">{t(m.collapsibleText)}</Collapsible>
    </div>
  );
}

export function CarouselDemo() {
  const t = useText();
  return (
    <div style={{ maxWidth: 480 }}>
      <Carousel>
        {[1, 2].map((n) => {
          const title = t(m.slide, { number: t.number(n) });
          return (
            <Carousel.Item key={n}>
              <img className="d-block w-100" src={IMAGE} alt={title} />
              <Carousel.Caption><h3>{title}</h3></Carousel.Caption>
            </Carousel.Item>
          );
        })}
      </Carousel>
    </div>
  );
}

export function AvatarDemo() {
  const t = useText();
  return (
    <Row>
      {['xs', 'sm', 'md', 'lg', 'xl', 'huge'].map((s) => <Avatar key={s} size={s} alt={t(m.profilePicture)} />)}
      <AvatarButton>{t(m.profile)}</AvatarButton>
      <AvatarButton showLabel={false} variant="primary">{t(m.profile)}</AvatarButton>
    </Row>
  );
}

export function ImageDemo() {
  const t = useText();
  return (
    <Row>
      <Image src={IMAGE} alt={t(m.framedImage)} thumbnail style={{ width: 160 }} />
      <Image src={IMAGE} alt={t(m.roundedImage)} rounded style={{ width: 160 }} />
      <Figure>
        <Figure.Image src={IMAGE} alt={t(m.captionedImage)} width={160} />
        <Figure.Caption>{t(m.caption)}</Figure.Caption>
      </Figure>
    </Row>
  );
}

const Block = ({ children }) => <div className="preview-layout-block">{children}</div>;

export function LayoutDemo() {
  const t = useText();
  return (
    <>
      <Label>{t(m.columnsHeading)}</Label>
      <Layout
        lg={[{ span: 8 }, { span: 4 }]} md={[{ span: 8 }, { span: 4 }]} sm={[{ span: 12 }, { span: 12 }]}
        xs={[{ span: 12 }, { span: 12 }]} xl={[{ span: 9 }, { span: 3 }]}
      >
        <Layout.Element><Block>{t(m.mainContent)}</Block></Layout.Element>
        <Layout.Element><Block>{t(m.sideColumn)}</Block></Layout.Element>
      </Layout>
      <Label>{t(m.widthHeading)}</Label>
      <Container size="md" className="px-0">
        <GridRow>{[1, 2, 3].map((n) => <Col key={n}><Block>{t(m.column)}</Block></Col>)}</GridRow>
      </Container>
      <Label>{t(m.spaceHeading)}</Label>
      <Stack direction="horizontal" gap={3} className="mb-3">
        {[1, 2, 3].map((n) => <Block key={n}>{t(m.stackItem)}</Block>)}
      </Stack>
      <ActionRow className="mb-3">
        <span>{t(m.buttonRow)}</span><ActionRow.Spacer />
        <Button variant="tertiary">{t(m.cancel)}</Button><Button>{t(m.save)}</Button>
      </ActionRow>
      <Label>{t(m.scrollHeading)}</Label>
      <Scrollable style={{ maxHeight: 90 }} className="border p-2 mb-3">
        {Array.from({ length: 8 }, (_, i) => <p key={i}>{t(m.line, { number: t.number(i + 1) })}</p>)}
      </Scrollable>
      <div style={{ maxWidth: 360 }}>
        <Truncate lines={2}>{t(m.longText)}</Truncate>
      </div>
    </>
  );
}
