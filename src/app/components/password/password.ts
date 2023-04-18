import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
    AfterContentInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    Directive,
    DoCheck,
    ElementRef,
    EventEmitter,
    forwardRef,
    HostListener,
    Inject,
    Input,
    NgModule,
    NgZone,
    OnDestroy,
    OnInit,
    Output,
    Pipe,
    PipeTransform,
    PLATFORM_ID,
    QueryList,
    Renderer2,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayService, PrimeNGConfig, PrimeTemplate, SharedModule, TranslationKeys } from 'primeng/api';
import { ConnectedOverlayScrollHandler, DomHandler } from 'primeng/dom';
import { InputTextModule } from 'primeng/inputtext';
import { ZIndexUtils } from 'primeng/utils';
import { Subscription } from 'rxjs';
import { TimesIcon } from 'primeng/icon/times';
import { EyeSlashIcon } from 'primeng/icon/eyeslash';
import { EyeIcon } from 'primeng/icon/eye';

@Directive({
    selector: '[pPassword]',
    host: {
        class: 'p-inputtext p-component p-element',
        '[class.p-filled]': 'filled'
    }
})
export class PasswordDirective implements OnDestroy, DoCheck {
    @Input() promptLabel: string = 'Enter a password';

    @Input() weakLabel: string = 'Weak';

    @Input() mediumLabel: string = 'Medium';

    @Input() strongLabel: string = 'Strong';

    @Input() feedback: boolean = true;

    @Input() set showPassword(show: boolean) {
        this.el.nativeElement.type = show ? 'text' : 'password';
    }

    panel: HTMLDivElement;

    meter: any;

    info: any;

    filled: boolean;

    scrollHandler: ConnectedOverlayScrollHandler;

    documentResizeListener: () => void | null;

    constructor(@Inject(DOCUMENT) private document: Document, @Inject(PLATFORM_ID) private platformId: any, private renderer: Renderer2, public el: ElementRef, public zone: NgZone) {}

    ngDoCheck() {
        this.updateFilledState();
    }

    @HostListener('input', ['$event'])
    onInput(e) {
        this.updateFilledState();
    }

    updateFilledState() {
        this.filled = this.el.nativeElement.value && this.el.nativeElement.value.length;
    }

    createPanel() {
        if (isPlatformBrowser(this.platformId)) {
            this.panel = this.renderer.createElement('div');
            this.renderer.addClass(this.panel, 'p-password-panel');
            this.renderer.addClass(this.panel, 'p-component');
            this.renderer.addClass(this.panel, 'p-password-panel-overlay');
            this.renderer.addClass(this.panel, 'p-connected-overlay');

            this.meter = this.renderer.createElement('div');
            this.renderer.addClass(this.meter, 'p-password-meter');
            this.renderer.appendChild(this.panel, this.meter);

            this.info = this.renderer.createElement('div');
            this.renderer.addClass(this.info, 'p-password-info');
            this.renderer.setProperty(this.info, 'textContent', this.promptLabel);
            this.renderer.appendChild(this.panel, this.info);

            this.renderer.setStyle(this.panel, 'minWidth', `${this.el.nativeElement.offsetWidth}px`);
            this.renderer.appendChild(document.body, this.panel);
        }
    }

    showOverlay() {
        if (this.feedback) {
            if (!this.panel) {
                this.createPanel();
            }

            this.renderer.setStyle(this.panel, 'zIndex', String(++DomHandler.zindex));
            this.renderer.setStyle(this.panel, 'display', 'block');
            this.zone.runOutsideAngular(() => {
                setTimeout(() => {
                    DomHandler.addClass(this.panel, 'p-connected-overlay-visible');
                    this.bindScrollListener();
                    this.bindDocumentResizeListener();
                }, 1);
            });
            DomHandler.absolutePosition(this.panel, this.el.nativeElement);
        }
    }

    hideOverlay() {
        if (this.feedback && this.panel) {
            DomHandler.addClass(this.panel, 'p-connected-overlay-hidden');
            DomHandler.removeClass(this.panel, 'p-connected-overlay-visible');
            this.unbindScrollListener();
            this.unbindDocumentResizeListener();

            this.zone.runOutsideAngular(() => {
                setTimeout(() => {
                    this.ngOnDestroy();
                }, 150);
            });
        }
    }

    @HostListener('focus')
    onFocus() {
        this.showOverlay();
    }

    @HostListener('blur')
    onBlur() {
        this.hideOverlay();
    }

    @HostListener('keyup', ['$event'])
    onKeyup(e) {
        if (this.feedback) {
            let value = e.target.value,
                label = null,
                meterPos = null;

            if (value.length === 0) {
                label = this.promptLabel;
                meterPos = '0px 0px';
            } else {
                var score = this.testStrength(value);

                if (score < 30) {
                    label = this.weakLabel;
                    meterPos = '0px -10px';
                } else if (score >= 30 && score < 80) {
                    label = this.mediumLabel;
                    meterPos = '0px -20px';
                } else if (score >= 80) {
                    label = this.strongLabel;
                    meterPos = '0px -30px';
                }
            }

            if (!this.panel || !DomHandler.hasClass(this.panel, 'p-connected-overlay-visible')) {
                this.showOverlay();
            }

            this.renderer.setStyle(this.meter, 'backgroundPosition', meterPos);
            this.info.textContent = label;
        }
    }

    testStrength(str: string) {
        let grade: number = 0;
        let val: RegExpMatchArray;

        val = str.match('[0-9]');
        grade += this.normalize(val ? val.length : 1 / 4, 1) * 25;

        val = str.match('[a-zA-Z]');
        grade += this.normalize(val ? val.length : 1 / 2, 3) * 10;

        val = str.match('[!@#$%^&*?_~.,;=]');
        grade += this.normalize(val ? val.length : 1 / 6, 1) * 35;

        val = str.match('[A-Z]');
        grade += this.normalize(val ? val.length : 1 / 6, 1) * 30;

        grade *= str.length / 8;

        return grade > 100 ? 100 : grade;
    }

    normalize(x, y) {
        let diff = x - y;

        if (diff <= 0) return x / y;
        else return 1 + 0.5 * (x / (x + y / 4));
    }

    get disabled(): boolean {
        return this.el.nativeElement.disabled;
    }

    bindScrollListener() {
        if (!this.scrollHandler) {
            this.scrollHandler = new ConnectedOverlayScrollHandler(this.el.nativeElement, () => {
                if (DomHandler.hasClass(this.panel, 'p-connected-overlay-visible')) {
                    this.hideOverlay();
                }
            });
        }

        this.scrollHandler.bindScrollListener();
    }

    unbindScrollListener() {
        if (this.scrollHandler) {
            this.scrollHandler.unbindScrollListener();
        }
    }

    bindDocumentResizeListener() {
        if (isPlatformBrowser(this.platformId)) {
            if (!this.documentResizeListener) {
                const window = this.document.defaultView as Window;
                this.documentResizeListener = this.renderer.listen(window, 'resize', this.onWindowResize.bind(this));
            }
        }
    }

    unbindDocumentResizeListener() {
        if (this.documentResizeListener) {
            this.documentResizeListener();
            this.documentResizeListener = null;
        }
    }

    onWindowResize() {
        if (!DomHandler.isTouchDevice()) {
            this.hideOverlay();
        }
    }

    ngOnDestroy() {
        if (this.panel) {
            if (this.scrollHandler) {
                this.scrollHandler.destroy();
                this.scrollHandler = null;
            }

            this.unbindDocumentResizeListener();

            this.renderer.removeChild(this.document.body, this.panel);
            this.panel = null;
            this.meter = null;
            this.info = null;
        }
    }
}

type Mapper<T, G> = (item: T, ...args: any[]) => G;

@Pipe({
    name: 'mapper',
    pure: true
})
export class MapperPipe implements PipeTransform {
    public transform<T, G>(value: T, mapper: Mapper<T, G>, ...args: unknown[]): G {
        return mapper(value, ...args);
    }
}

export const Password_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => Password),
    multi: true
};
@Component({
    selector: 'p-password',
    template: `
        <div [ngClass]="toggleMask | mapper: containerClass" [ngStyle]="style" [class]="styleClass">
            <input
                #input
                [attr.label]="label"
                [attr.aria-label]="ariaLabel"
                [attr.aria-labelledBy]="ariaLabelledBy"
                [attr.id]="inputId"
                pInputText
                [ngClass]="disabled | mapper: inputFieldClass"
                [ngStyle]="inputStyle"
                [class]="inputStyleClass"
                [attr.type]="unmasked | mapper: inputType"
                [attr.placeholder]="placeholder"
                [value]="value"
                (input)="onInput($event)"
                (focus)="onInputFocus($event)"
                (blur)="onInputBlur($event)"
                (keyup)="onKeyUp($event)"
                (keydown)="onKeyDown($event)"
                [attr.maxlength]="maxLength"
            />
            <ng-container *ngIf="showClear && value != null">
                <TimesIcon *ngIf="!clearIconTemplate" [ngClass]="'p-password-clear-icon'" (click)="clear()" />
                <span (click)="clear()" class="p-password-clear-icon">
                    <ng-template *ngTemplateOutlet="clearIconTemplate"></ng-template>
                </span>    
            </ng-container>

            <ng-container *ngIf="toggleMask">
                <ng-container *ngIf="unmasked">
                    <EyeSlashIcon *ngIf="!hideIconTemplate" (click)="onMaskToggle()"/>
                    <span *ngIf="hideIconTemplate" (click)="onMaskToggle()">
                        <ng-template *ngTemplateOutlet="hideIconTemplate"></ng-template>
                    </span>
                </ng-container>
                <ng-container *ngIf="!unmasked">
                    <EyeIcon *ngIf="!showIconTemplate" (click)="onMaskToggle()"/>
                    <span *ngIf="showIconTemplate" (click)="onMaskToggle()">
                        <ng-template *ngTemplateOutlet="showIconTemplate"></ng-template>
                    </span>
                </ng-container>
            </ng-container>

            <div
                #overlay
                *ngIf="overlayVisible"
                [ngClass]="'p-password-panel p-component'"
                (click)="onOverlayClick($event)"
                [@overlayAnimation]="{ value: 'visible', params: { showTransitionParams: showTransitionOptions, hideTransitionParams: hideTransitionOptions } }"
                (@overlayAnimation.start)="onAnimationStart($event)"
                (@overlayAnimation.done)="onAnimationEnd($event)"
            >
                <ng-container *ngTemplateOutlet="headerTemplate"></ng-container>
                <ng-container *ngIf="contentTemplate; else content">
                    <ng-container *ngTemplateOutlet="contentTemplate"></ng-container>
                </ng-container>
                <ng-template #content>
                    <div class="p-password-meter">
                        <div [ngClass]="meter | mapper: strengthClass" [ngStyle]="{ width: meter ? meter.width : '' }"></div>
                    </div>
                    <div className="p-password-info">{{ infoText }}</div>
                </ng-template>
                <ng-container *ngTemplateOutlet="footerTemplate"></ng-container>
            </div>
        </div>
    `,
    animations: [trigger('overlayAnimation', [transition(':enter', [style({ opacity: 0, transform: 'scaleY(0.8)' }), animate('{{showTransitionParams}}')]), transition(':leave', [animate('{{hideTransitionParams}}', style({ opacity: 0 }))])])],
    host: {
        class: 'p-element p-inputwrapper',
        '[class.p-inputwrapper-filled]': 'filled()',
        '[class.p-inputwrapper-focus]': 'focused',
        '[class.p-password-clearable]': 'showClear',
        '[class.p-password-mask]': 'toggleMask'
    },
    providers: [Password_VALUE_ACCESSOR],
    styleUrls: ['./password.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class Password implements AfterContentInit, OnInit {
    @Input() ariaLabel: string;

    @Input() ariaLabelledBy: string;

    @Input() label: string;

    @Input() disabled: boolean;

    @Input() promptLabel: string;

    @Input() mediumRegex: string = '^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})';

    @Input() strongRegex: string = '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})';

    @Input() weakLabel: string;

    @Input() mediumLabel: string;

    @Input() maxLength: number;

    @Input() strongLabel: string;

    @Input() inputId: string;

    @Input() feedback: boolean = true;

    @Input() appendTo: any;

    @Input() toggleMask: boolean;

    @Input() inputStyleClass: string;

    @Input() panelStyle: any;

    @Input() panelStyleClass: string;

    @Input() styleClass: string;

    @Input() style: any;

    @Input() inputStyle: any;

    @Input() showTransitionOptions: string = '.12s cubic-bezier(0, 0, 0.2, 1)';

    @Input() hideTransitionOptions: string = '.1s linear';

    @Input() placeholder: string;

    @Input() showClear: boolean = false;

    @ViewChild('input') input: ElementRef;

    @Output() onFocus: EventEmitter<any> = new EventEmitter();

    @Output() onBlur: EventEmitter<any> = new EventEmitter();

    @Output() onClear: EventEmitter<any> = new EventEmitter();

    contentTemplate: TemplateRef<any>;

    footerTemplate: TemplateRef<any>;

    headerTemplate: TemplateRef<any>;

    clearIconTemplate: TemplateRef<any>;

    hideIconTemplate: TemplateRef<any>;

    showIconTemplate: TemplateRef<any>;

    @ContentChildren(PrimeTemplate) templates: QueryList<any>;

    overlayVisible: boolean = false;

    meter: any;

    infoText: string;

    focused: boolean = false;

    unmasked: boolean = false;

    mediumCheckRegExp: any;

    strongCheckRegExp: any;

    resizeListener: VoidFunction | null;

    scrollHandler: ConnectedOverlayScrollHandler | null;

    overlay: any;

    value: string = null;

    onModelChange: Function = () => {};

    onModelTouched: Function = () => {};

    translationSubscription: Subscription;

    constructor(
        @Inject(DOCUMENT) private document: Document,
        @Inject(PLATFORM_ID) private platformId: any,
        private renderer: Renderer2,
        private cd: ChangeDetectorRef,
        private config: PrimeNGConfig,
        public el: ElementRef,
        public overlayService: OverlayService
    ) {}

    ngAfterContentInit() {
        this.templates.forEach((item) => {
            switch (item.getType()) {
                case 'content':
                    this.contentTemplate = item.template;
                    break;

                case 'header':
                    this.headerTemplate = item.template;
                    break;

                case 'footer':
                    this.footerTemplate = item.template;
                    break;

                case 'clearicon':
                    this.clearIconTemplate = item.template;
                    break;

                case 'hideicon':
                    this.hideIconTemplate = item.template;
                    break;

                case 'showicon':
                    this.showIconTemplate = item.template;
                    break;

                default:
                    this.contentTemplate = item.template;
                    break;
            }
        });
    }

    ngOnInit() {
        this.infoText = this.promptText();
        this.mediumCheckRegExp = new RegExp(this.mediumRegex);
        this.strongCheckRegExp = new RegExp(this.strongRegex);
        this.translationSubscription = this.config.translationObserver.subscribe(() => {
            this.updateUI(this.value || '');
        });
    }

    onAnimationStart(event) {
        switch (event.toState) {
            case 'visible':
                this.overlay = event.element;
                ZIndexUtils.set('overlay', this.overlay, this.config.zIndex.overlay);
                this.appendContainer();
                this.alignOverlay();
                this.bindScrollListener();
                this.bindResizeListener();
                break;

            case 'void':
                this.unbindScrollListener();
                this.unbindResizeListener();
                this.overlay = null;
                break;
        }
    }

    onAnimationEnd(event) {
        switch (event.toState) {
            case 'void':
                ZIndexUtils.clear(event.element);
                break;
        }
    }

    appendContainer() {
        if (this.appendTo) {
            if (this.appendTo === 'body') this.renderer.appendChild(this.document.body, this.overlay);
            else this.document.getElementById(this.appendTo).appendChild(this.overlay);
        }
    }

    alignOverlay() {
        if (this.appendTo) {
            this.overlay.style.minWidth = DomHandler.getOuterWidth(this.input.nativeElement) + 'px';
            DomHandler.absolutePosition(this.overlay, this.input.nativeElement);
        } else {
            DomHandler.relativePosition(this.overlay, this.input.nativeElement);
        }
    }

    onInput(event) {
        this.value = event.target.value;
        this.onModelChange(this.value);
    }

    onInputFocus(event: Event) {
        this.focused = true;
        if (this.feedback) {
            this.overlayVisible = true;
        }

        this.onFocus.emit(event);
    }

    onInputBlur(event: Event) {
        this.focused = false;
        if (this.feedback) {
            this.overlayVisible = false;
        }

        this.onModelTouched();
        this.onBlur.emit(event);
    }

    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            this.overlayVisible = false;
        }
    }

    onKeyUp(event) {
        if (this.feedback) {
            let value = event.target.value;
            this.updateUI(value);

            if (!this.overlayVisible) {
                this.overlayVisible = true;
            }
        }
    }

    updateUI(value) {
        let label = null;
        let meter = null;

        switch (this.testStrength(value)) {
            case 1:
                label = this.weakText();
                meter = {
                    strength: 'weak',
                    width: '33.33%'
                };
                break;

            case 2:
                label = this.mediumText();
                meter = {
                    strength: 'medium',
                    width: '66.66%'
                };
                break;

            case 3:
                label = this.strongText();
                meter = {
                    strength: 'strong',
                    width: '100%'
                };
                break;

            default:
                label = this.promptText();
                meter = null;
                break;
        }

        this.meter = meter;
        this.infoText = label;
    }

    onMaskToggle() {
        this.unmasked = !this.unmasked;
    }

    onOverlayClick(event) {
        this.overlayService.add({
            originalEvent: event,
            target: this.el.nativeElement
        });
    }

    testStrength(str) {
        let level = 0;

        if (this.strongCheckRegExp.test(str)) level = 3;
        else if (this.mediumCheckRegExp.test(str)) level = 2;
        else if (str.length) level = 1;

        return level;
    }

    writeValue(value: any): void {
        if (value === undefined) this.value = null;
        else this.value = value;

        if (this.feedback) this.updateUI(this.value || '');

        this.cd.markForCheck();
    }

    registerOnChange(fn: Function): void {
        this.onModelChange = fn;
    }

    registerOnTouched(fn: Function): void {
        this.onModelTouched = fn;
    }

    setDisabledState(val: boolean): void {
        this.disabled = val;
        this.cd.markForCheck();
    }

    bindScrollListener() {
        if (isPlatformBrowser(this.platformId)) {
            if (!this.scrollHandler) {
                this.scrollHandler = new ConnectedOverlayScrollHandler(this.input.nativeElement, () => {
                    if (this.overlayVisible) {
                        this.overlayVisible = false;
                    }
                });
            }

            this.scrollHandler.bindScrollListener();
        }
    }

    bindResizeListener() {
        if (isPlatformBrowser(this.platformId)) {
            if (!this.resizeListener) {
                const window = this.document.defaultView as Window;
                this.resizeListener = this.renderer.listen(window, 'resize', () => {
                    if (this.overlayVisible && !DomHandler.isTouchDevice()) {
                        this.overlayVisible = false;
                    }
                });
            }
        }
    }

    unbindScrollListener() {
        if (this.scrollHandler) {
            this.scrollHandler.unbindScrollListener();
        }
    }

    unbindResizeListener() {
        if (this.resizeListener) {
            this.resizeListener();
            this.resizeListener = null;
        }
    }

    containerClass(toggleMask: boolean) {
        return { 'p-password p-component p-inputwrapper': true, 'p-input-icon-right': toggleMask };
    }

    inputFieldClass(disabled: boolean) {
        return { 'p-password-input': true, 'p-disabled': disabled };
    }

    strengthClass(meter: any) {
        return `p-password-strength ${meter ? meter.strength : ''}`;
    }

    filled() {
        return this.value != null && this.value.toString().length > 0;
    }

    promptText() {
        return this.promptLabel || this.getTranslation(TranslationKeys.PASSWORD_PROMPT);
    }

    weakText() {
        return this.weakLabel || this.getTranslation(TranslationKeys.WEAK);
    }

    mediumText() {
        return this.mediumLabel || this.getTranslation(TranslationKeys.MEDIUM);
    }

    strongText() {
        return this.strongLabel || this.getTranslation(TranslationKeys.STRONG);
    }

    restoreAppend() {
        if (this.overlay && this.appendTo) {
            if (this.appendTo === 'body') this.renderer.removeChild(this.document.body, this.overlay);
            else this.document.getElementById(this.appendTo).removeChild(this.overlay);
        }
    }

    inputType(unmasked: boolean) {
        return unmasked ? 'text' : 'password';
    }

    getTranslation(option: string) {
        return this.config.getTranslation(option);
    }

    clear() {
        this.value = null;
        this.onModelChange(this.value);
        this.writeValue(this.value);
        this.onClear.emit();
    }

    ngOnDestroy() {
        if (this.overlay) {
            ZIndexUtils.clear(this.overlay);
            this.overlay = null;
        }

        this.restoreAppend();
        this.unbindResizeListener();

        if (this.scrollHandler) {
            this.scrollHandler.destroy();
            this.scrollHandler = null;
        }

        if (this.translationSubscription) {
            this.translationSubscription.unsubscribe();
        }
    }
}

@NgModule({
    imports: [CommonModule, InputTextModule, TimesIcon, EyeSlashIcon, EyeIcon],
    exports: [PasswordDirective, Password, SharedModule],
    declarations: [PasswordDirective, Password, MapperPipe]
})
export class PasswordModule {}
