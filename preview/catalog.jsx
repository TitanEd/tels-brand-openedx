/*
 * What the page shows, in order. `paths` are token file prefixes relative to core/ or themes/<mode>/ in
 * paragon/tokens/src: every token belongs to the first entry whose prefix matches its file (minus `exclude`).
 */
import * as Demo from './demos';
import m from './catalog.messages';

export const GLOBAL_GROUPS = [
  { id: 'g-colors', name: m.colorsName, description: m.colorsText, paths: ['global/color.json'] },
  { id: 'g-surfaces', name: m.surfacesName, description: m.surfacesText, paths: ['global/surfaces.json'] },
  { id: 'g-palette', name: m.paletteName, description: m.paletteText, paths: ['global/palette.json'] },
  {
    id: 'g-typography', name: m.typographyName, description: m.typographyText, paths: ['global/typography.json'],
    demo: Demo.TypographySpecimen,
  },
  { id: 'g-spacing', name: m.spacingName, description: m.spacingText, paths: ['global/spacing.json'] },
  { id: 'g-size', name: m.sizeName, description: m.sizeText, paths: ['global/size.json'] },
  { id: 'g-elevation', name: m.elevationName, description: m.elevationText, paths: ['global/elevation.json'] },
  { id: 'g-transition', name: m.motionName, description: m.motionText, paths: ['global/transition.json'] },
];

export const COMPONENTS = [
  { id: 'text', name: m.textName, description: m.textText, demo: Demo.TextDemo, paths: ['components/text/', 'components/list/'] },
  { id: 'link', name: m.linkName, description: m.linkText, demo: Demo.LinkDemo, paths: ['components/link/'] },
  { id: 'code', name: m.codeName, description: m.codeText, demo: Demo.CodeDemo, paths: ['components/code/'] },
  {
    id: 'button', name: m.buttonName, description: m.buttonText, note: m.buttonNote, demo: Demo.ButtonDemo,
    paths: ['components/button/'], exclude: ['components/button/icon-'],
  },
  {
    id: 'icon-button', name: m.iconButtonName, description: m.iconButtonText, demo: Demo.IconButtonDemo,
    paths: ['components/button/icon-', 'components/icon-button/'],
  },
  { id: 'icon', name: m.iconName, description: m.iconText, demo: Demo.IconDemo, paths: ['components/icon/'] },
  {
    id: 'close-button', name: m.closeButtonName, description: m.closeButtonText, demo: Demo.CloseButtonDemo,
    paths: ['components/close-button/'],
  },
  {
    id: 'dropdown', name: m.dropdownName, description: m.dropdownText, demo: Demo.DropdownDemo,
    paths: ['components/dropdown/', 'components/caret/'],
  },
  { id: 'menu', name: m.menuName, description: m.menuText, demo: Demo.MenuDemo, paths: ['components/menu/'] },
  { id: 'alert', name: m.alertName, description: m.alertText, demo: Demo.AlertDemo, paths: ['components/alert/'] },
  {
    id: 'page-banner', name: m.pageBannerName, description: m.pageBannerText, demo: Demo.PageBannerDemo,
    paths: ['components/page-banner/'],
  },
  { id: 'toast', name: m.toastName, description: m.toastText, demo: Demo.ToastDemo, paths: ['components/toast/'] },
  { id: 'badge', name: m.badgeName, description: m.badgeText, demo: Demo.BadgeDemo, paths: ['components/badge/'] },
  { id: 'bubble', name: m.bubbleName, description: m.bubbleText, demo: Demo.BubbleDemo, paths: ['components/bubble/'] },
  {
    id: 'chip', name: m.chipName, description: m.chipText, demo: Demo.ChipDemo,
    paths: ['components/chip/', 'components/chip-carousel/'],
  },
  {
    id: 'annotation', name: m.annotationName, description: m.annotationText, demo: Demo.AnnotationDemo,
    paths: ['components/annotation/'],
  },
  { id: 'card', name: m.cardName, description: m.cardText, demo: Demo.CardDemo, paths: ['components/card/'] },
  {
    id: 'form', name: m.formName, description: m.formText, demo: Demo.FormDemo, paths: ['components/form/'],
    exclude: ['components/form/search-field', 'components/form/selectable-box'],
  },
  {
    id: 'search-field', name: m.searchName, description: m.searchText, demo: Demo.SearchFieldDemo,
    paths: ['components/form/search-field', 'components/search-field/'],
  },
  {
    id: 'selectable-box', name: m.selectableName, description: m.selectableText, demo: Demo.SelectableBoxDemo,
    paths: ['components/form/selectable-box', 'components/selectable-box/'],
  },
  {
    id: 'dropzone', name: m.dropzoneName, description: m.dropzoneText, demo: Demo.DropzoneDemo,
    paths: ['components/dropzone/'],
  },
  {
    id: 'color-picker', name: m.colorPickerName, description: m.colorPickerText, demo: Demo.ColorPickerDemo,
    paths: ['components/color-picker/'],
  },
  { id: 'tabs', name: m.tabsName, description: m.tabsText, demo: Demo.TabsDemo, paths: ['components/tabs/'] },
  {
    id: 'breadcrumb', name: m.breadcrumbName, description: m.breadcrumbText, demo: Demo.BreadcrumbDemo,
    paths: ['components/breadcrumb/'],
  },
  {
    id: 'pagination', name: m.paginationName, description: m.paginationText, demo: Demo.PaginationDemo,
    paths: ['components/pagination/'],
  },
  {
    id: 'navbar', name: m.navbarName, description: m.navbarText, demo: Demo.NavbarDemo,
    paths: ['components/navbar/', 'components/header/'],
  },
  { id: 'stepper', name: m.stepperName, description: m.stepperText, demo: Demo.StepperDemo, paths: ['components/stepper/'] },
  { id: 'tooltip', name: m.tooltipName, description: m.tooltipText, demo: Demo.TooltipDemo, paths: ['components/tooltip/'] },
  { id: 'popover', name: m.popoverName, description: m.popoverText, demo: Demo.PopoverDemo, paths: ['components/popover/'] },
  {
    id: 'product-tour', name: m.tourName, description: m.tourText, demo: Demo.ProductTourDemo,
    paths: ['components/product-tour/'],
  },
  { id: 'modal', name: m.modalName, description: m.modalText, demo: Demo.ModalDemo, paths: ['components/modal/'] },
  { id: 'sheet', name: m.sheetName, description: m.sheetText, demo: Demo.SheetDemo, paths: ['components/sheet/'] },
  { id: 'data-table', name: m.tableName, description: m.tableText, demo: Demo.DataTableDemo, paths: ['components/table/'] },
  { id: 'spinner', name: m.spinnerName, description: m.spinnerText, demo: Demo.SpinnerDemo, paths: ['components/spinner/'] },
  {
    id: 'progress-bar', name: m.progressName, description: m.progressText, demo: Demo.ProgressBarDemo,
    paths: ['components/progress-bar/'],
  },
  {
    id: 'skeleton', name: m.skeletonName, description: m.skeletonText, demo: Demo.SkeletonDemo,
    paths: ['components/skeleton/'],
  },
  {
    id: 'collapsible', name: m.collapsibleName, description: m.collapsibleText, demo: Demo.CollapsibleDemo,
    paths: ['components/collapsible/'],
  },
  {
    id: 'carousel', name: m.carouselName, description: m.carouselText, demo: Demo.CarouselDemo,
    paths: ['components/carousel/'],
  },
  {
    id: 'avatar', name: m.avatarName, description: m.avatarText, demo: Demo.AvatarDemo,
    paths: ['components/avatar/', 'components/avatar-button/'],
  },
  { id: 'image', name: m.imageName, description: m.imageText, demo: Demo.ImageDemo, paths: ['components/image/'] },
  {
    id: 'layout', name: m.layoutName, description: m.layoutText, demo: Demo.LayoutDemo,
    paths: ['components/container/', 'components/stack/', 'components/action-row/', 'components/scrollable/'],
  },
];

export const OTHER_COMPONENTS = {
  id: 'other', name: m.otherComponentsName, description: m.otherComponentsText, paths: [],
};
export const OTHER_GLOBALS = {
  id: 'g-other', name: m.otherGlobalName, description: m.otherGlobalText, paths: [],
};
