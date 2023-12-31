import { Subject, Subscription, from, EMPTY, isEmpty } from 'rxjs';
import { ɵNG_PIPE_DEF, ɵgetLContext, ɵglobal } from '@angular/core';
import 'reflect-metadata';
import { mergeMap, takeUntil } from 'rxjs/operators';

const NG_PIPE_DEF = ɵNG_PIPE_DEF;
function isPipe(target) {
    return !!target[NG_PIPE_DEF];
}

/**
 * Applied to instances and stores `Subject` instance when
 * no custom destroy method is provided.
 */
const DESTROY = Symbol('__destroy');
/**
 * Applied to definitions and informs that class is decorated
 */
const DECORATOR_APPLIED = Symbol('__decoratorApplied');
/**
 * If we use the `untilDestroyed` operator multiple times inside the single
 * instance providing different `destroyMethodName`, then all streams will
 * subscribe to the single subject. If any method is invoked, the subject will
 * emit and all streams will be unsubscribed. We wan't to prevent this behavior,
 * thus we store subjects under different symbols.
 */
function getSymbol(destroyMethodName) {
    if (typeof destroyMethodName === 'string') {
        return Symbol(`__destroy__${destroyMethodName}`);
    }
    else {
        return DESTROY;
    }
}
function markAsDecorated(type) {
    // Store this property on the prototype if it's an injectable class, component or directive.
    // We will be able to handle class extension this way.
    type.prototype[DECORATOR_APPLIED] = true;
}
function createSubjectOnTheInstance(instance, symbol) {
    if (!instance[symbol]) {
        instance[symbol] = new Subject();
    }
}
function completeSubjectOnTheInstance(instance, symbol) {
    if (instance[symbol]) {
        instance[symbol].next();
        instance[symbol].complete();
        // We also have to re-assign this property thus in the future
        // we will be able to create new subject on the same instance.
        instance[symbol] = null;
    }
}

function unsubscribe(property) {
    if (property instanceof Subscription) {
        property.unsubscribe();
    }
}
function unsubscribeIfPropertyIsArrayLike(property) {
    Array.isArray(property) && property.forEach(unsubscribe);
}
function decorateNgOnDestroy(ngOnDestroy, options) {
    return function () {
        var _a;
        // Invoke the original `ngOnDestroy` if it exists
        ngOnDestroy && ngOnDestroy.call(this);
        // It's important to use `this` instead of caching instance
        // that may lead to memory leaks
        completeSubjectOnTheInstance(this, getSymbol());
        // Check if subscriptions are pushed to some array
        if (options.arrayName) {
            unsubscribeIfPropertyIsArrayLike(this[options.arrayName]);
        }
        // Loop through the properties and find subscriptions
        if (options.checkProperties) {
            for (const property in this) {
                if ((_a = options.blackList) === null || _a === void 0 ? void 0 : _a.includes(property)) {
                    continue;
                }
                unsubscribe(this[property]);
            }
        }
    };
}
function decorateProviderDirectiveOrComponent(type, options) {
    type.prototype.ngOnDestroy = decorateNgOnDestroy(type.prototype.ngOnDestroy, options);
}
function decoratePipe(type, options) {
    const def = type.ɵpipe;
    def.onDestroy = decorateNgOnDestroy(def.onDestroy, options);
}
function UntilDestroy(options = {}) {
    return (type) => {
        if (options.className) {
            Reflect.defineMetadata('__className__', options.className, type.prototype);
        }
        if (isPipe(type)) {
            decoratePipe(type, options);
        }
        else {
            decorateProviderDirectiveOrComponent(type, options);
        }
        markAsDecorated(type);
    };
}

// `LView` is an array where each index matches the specific data structure.
// The 7th element in an `LView` is an array of cleanup listeners. They are
// invoked when the view is removed (similar to `ComponentRef.onDestroy`).
const CLEANUP = 7;
const CheckerHasBeenSet = Symbol('CheckerHasBeenSet');
function setupSubjectUnsubscribedChecker(instance, destroy$) {
    // This function is used within the `untilDestroyed` operator and setups a function that
    // listens for the view removal and checks if the `destroy$` subject has any observers (usually `takeUntil`).
    // Note: this code will not be shipped into production since it's guarded with `ngDevMode`,
    // this means it'll exist only in development mode.
    if (instance[CheckerHasBeenSet] || isAngularInTestMode()) {
        return;
    }
    runOutsideAngular(() => from(Promise.resolve())
        .pipe(mergeMap(() => {
        let lContext;
        try {
            // The `ɵgetLContext` might not work for a pipe, because it's not a component nor a directive,
            // which means there's no `RNode` for an instance.
            lContext = ɵgetLContext(instance);
        }
        catch (_a) {
            lContext = null;
        }
        const lView = lContext === null || lContext === void 0 ? void 0 : lContext.lView;
        if (lView == null) {
            return EMPTY;
        }
        const lCleanup = lView[CLEANUP] || (lView[CLEANUP] = []);
        const cleanupHasBeenExecuted$ = new Subject();
        // Note: this function is named for debugging purposes.
        lCleanup.push(function untilDestroyedLCleanup() {
            // We leave the Angular zone, so RxJS will also call subsequent `next` functions
            // outside of the Angular zone, which is done to avoid scheduling a microtask (through
            // `asapScheduler`) within the Angular zone.
            runOutsideAngular(() => {
                cleanupHasBeenExecuted$.next();
                cleanupHasBeenExecuted$.complete();
            });
        });
        return cleanupHasBeenExecuted$;
    }), 
    // We can't use `observeOn(asapScheduler)` because this might break the app's change detection.
    // RxJS schedulers coalesce tasks and then flush the queue, which means our task might be scheduled
    // within the root zone, and then all of the tasks (that were set up by developers in the Angular zone)
    // will also be flushed in the root zone.
    mergeMap(() => Promise.resolve()))
        .subscribe(() => {
        var _a;
        // Note: The `observed` property is available only in RxJS@7.2.0, which will throw
        // an error in lower versions. We have integration test with RxJS@6 to ensure we don't
        // import operators from `rxjs`; that's why it's wrapped into braces. The `observers`
        // property is also being deprecated.
        const observed = (_a = destroy$['observed']) !== null && _a !== void 0 ? _a : destroy$['observers'].length > 0;
        if (observed) {
            console.warn(createMessage(instance));
        }
    }));
    instance[CheckerHasBeenSet] = true;
}
function isAngularInTestMode() {
    // Gets whether the code is currently running in a test environment.
    // We don't use `declare const` because it might cause conflicts with the real typings.
    return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (typeof __karma__ !== 'undefined' && !!__karma__) ||
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (typeof jasmine !== 'undefined' && !!jasmine) ||
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (typeof jest !== 'undefined' && !!jest) ||
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (typeof Mocha !== 'undefined' && !!Mocha) ||
        // Jest is not defined in ESM mode since it must be access only by importing from `@jest/globals`.
        // There's no way to check if we're in Jest ESM mode or not, but we can check if the `process` is defined.
        // Note: it's required to check for `[object process]` because someone might be running unit tests with
        // Webpack and shimming `process`.
        (typeof process !== 'undefined' &&
            Object.prototype.toString.call(process) === '[object process]'));
}
function runOutsideAngular(fn) {
    var _a;
    // We cannot inject the `NgZone` class when running the checker. The `__ngContext__` is read
    // for the first time within a microtask which triggers change detection; we want to avoid that.
    // The `Zone` is always available globally when the `zone.js` is imported. Otherwise, it may be
    // nooped through bootstrap options. The `NgZone.runOutsideAngular` calls `Zone.root.run`, so we're
    // safe calling that function directly.
    const Zone = ɵglobal.Zone;
    const isNgZoneEnabled = !!Zone && typeof ((_a = Zone.root) === null || _a === void 0 ? void 0 : _a.run) === 'function';
    return isNgZoneEnabled ? Zone.root.run(fn) : fn();
}
function createMessage(instance) {
    return `
  The ${instance.constructor.name} still has subscriptions that haven't been unsubscribed.
  `;
}

const NG_DEV_MODE = typeof ngDevMode === 'undefined' || ngDevMode;
function overrideNonDirectiveInstanceMethod(instance, destroyMethodName, symbol) {
    const originalDestroy = instance[destroyMethodName];
    if (NG_DEV_MODE && typeof originalDestroy !== 'function') {
        throw new Error(`${instance.constructor.name} is using untilDestroyed but doesn't implement ${destroyMethodName}`);
    }
    createSubjectOnTheInstance(instance, symbol);
    instance[destroyMethodName] = function () {
        // eslint-disable-next-line prefer-rest-params
        originalDestroy.apply(this, arguments);
        completeSubjectOnTheInstance(this, symbol);
        // We have to re-assign this property back to the original value.
        // If the `untilDestroyed` operator is called for the same instance
        // multiple times, then we will be able to get the original
        // method again and not the patched one.
        instance[destroyMethodName] = originalDestroy;
    };
}
function untilDestroyed(instance, destroyMethodName) {
    return (source) => {
        const symbol = getSymbol(destroyMethodName);
        // If `destroyMethodName` is passed then the developer applies
        // this operator to something non-related to Angular DI system
        if (typeof destroyMethodName === 'string') {
            overrideNonDirectiveInstanceMethod(instance, destroyMethodName, symbol);
        }
        else {
            NG_DEV_MODE && ensureClassIsDecorated(instance);
            createSubjectOnTheInstance(instance, symbol);
        }
        const destroy$ = instance[symbol];
        setupSubjectUnsubscribedChecker(instance, destroy$);
        const startTime = Date.now();
        source.pipe(takeUntil(destroy$), isEmpty()).subscribe(empty => {
            if (empty) {
                const constructorPrototypeName = Reflect.getMetadata('__className__', instance.constructor.prototype);
                const endTime = Date.now();
                console.log(`Source observable is Empty. Constructor: ${constructorPrototypeName !== null && constructorPrototypeName !== void 0 ? constructorPrototypeName : instance.constructor.name}. Timespan: ${((endTime - startTime) / 1000).toFixed(2)}s`);
                throw new Error("testing if this is okay");
            }
        });
        return source.pipe(takeUntil(destroy$));
    };
}
function ensureClassIsDecorated(instance) {
    const prototype = Object.getPrototypeOf(instance);
    const missingDecorator = !(DECORATOR_APPLIED in prototype);
    if (missingDecorator) {
        throw new Error('untilDestroyed operator cannot be used inside directives or ' +
            'components or providers that are not decorated with UntilDestroy decorator');
    }
}

/**
 * Generated bundle index. Do not edit.
 */

export { UntilDestroy, untilDestroyed };
//# sourceMappingURL=ngneat-until-destroy.mjs.map
