import { Subject } from 'rxjs';
/**
 * Applied to instances and stores `Subject` instance when
 * no custom destroy method is provided.
 */
const DESTROY = Symbol('__destroy');
/**
 * Applied to definitions and informs that class is decorated
 */
export const DECORATOR_APPLIED = Symbol('__decoratorApplied');
/**
 * If we use the `untilDestroyed` operator multiple times inside the single
 * instance providing different `destroyMethodName`, then all streams will
 * subscribe to the single subject. If any method is invoked, the subject will
 * emit and all streams will be unsubscribed. We wan't to prevent this behavior,
 * thus we store subjects under different symbols.
 */
export function getSymbol(destroyMethodName) {
    if (typeof destroyMethodName === 'string') {
        return Symbol(`__destroy__${destroyMethodName}`);
    }
    else {
        return DESTROY;
    }
}
export function markAsDecorated(type) {
    // Store this property on the prototype if it's an injectable class, component or directive.
    // We will be able to handle class extension this way.
    type.prototype[DECORATOR_APPLIED] = true;
}
export function createSubjectOnTheInstance(instance, symbol) {
    if (!instance[symbol]) {
        instance[symbol] = new Subject();
    }
}
export function completeSubjectOnTheInstance(instance, symbol) {
    if (instance[symbol]) {
        instance[symbol].next();
        instance[symbol].complete();
        // We also have to re-assign this property thus in the future
        // we will be able to create new subject on the same instance.
        instance[symbol] = null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJuYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vbGlicy91bnRpbC1kZXN0cm95L3NyYy9saWIvaW50ZXJuYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFJL0I7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLEdBQWtCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUVuRDs7R0FFRztBQUNILE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFrQixNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUU3RTs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsU0FBUyxDQUFJLGlCQUEyQjtJQUN0RCxJQUFJLE9BQU8saUJBQWlCLEtBQUssUUFBUSxFQUFFO1FBQ3pDLE9BQU8sTUFBTSxDQUFDLGNBQWMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO0tBQ2xEO1NBQU07UUFDTCxPQUFPLE9BQU8sQ0FBQztLQUNoQjtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUM3QixJQUE2RTtJQUU3RSw0RkFBNEY7SUFDNUYsc0RBQXNEO0lBQ3RELElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDM0MsQ0FBQztBQVNELE1BQU0sVUFBVSwwQkFBMEIsQ0FBQyxRQUFhLEVBQUUsTUFBYztJQUN0RSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ3JCLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLE9BQU8sRUFBUSxDQUFDO0tBQ3hDO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSw0QkFBNEIsQ0FBQyxRQUFhLEVBQUUsTUFBYztJQUN4RSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUNwQixRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEIsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzVCLDZEQUE2RDtRQUM3RCw4REFBOEQ7UUFDOUQsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztLQUN6QjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlVHlwZSwgybVEaXJlY3RpdmVUeXBlLCDJtUNvbXBvbmVudFR5cGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFN1YmplY3QgfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHsgUGlwZVR5cGUgfSBmcm9tICcuL2l2eSc7XG5cbi8qKlxuICogQXBwbGllZCB0byBpbnN0YW5jZXMgYW5kIHN0b3JlcyBgU3ViamVjdGAgaW5zdGFuY2Ugd2hlblxuICogbm8gY3VzdG9tIGRlc3Ryb3kgbWV0aG9kIGlzIHByb3ZpZGVkLlxuICovXG5jb25zdCBERVNUUk9ZOiB1bmlxdWUgc3ltYm9sID0gU3ltYm9sKCdfX2Rlc3Ryb3knKTtcblxuLyoqXG4gKiBBcHBsaWVkIHRvIGRlZmluaXRpb25zIGFuZCBpbmZvcm1zIHRoYXQgY2xhc3MgaXMgZGVjb3JhdGVkXG4gKi9cbmV4cG9ydCBjb25zdCBERUNPUkFUT1JfQVBQTElFRDogdW5pcXVlIHN5bWJvbCA9IFN5bWJvbCgnX19kZWNvcmF0b3JBcHBsaWVkJyk7XG5cbi8qKlxuICogSWYgd2UgdXNlIHRoZSBgdW50aWxEZXN0cm95ZWRgIG9wZXJhdG9yIG11bHRpcGxlIHRpbWVzIGluc2lkZSB0aGUgc2luZ2xlXG4gKiBpbnN0YW5jZSBwcm92aWRpbmcgZGlmZmVyZW50IGBkZXN0cm95TWV0aG9kTmFtZWAsIHRoZW4gYWxsIHN0cmVhbXMgd2lsbFxuICogc3Vic2NyaWJlIHRvIHRoZSBzaW5nbGUgc3ViamVjdC4gSWYgYW55IG1ldGhvZCBpcyBpbnZva2VkLCB0aGUgc3ViamVjdCB3aWxsXG4gKiBlbWl0IGFuZCBhbGwgc3RyZWFtcyB3aWxsIGJlIHVuc3Vic2NyaWJlZC4gV2Ugd2FuJ3QgdG8gcHJldmVudCB0aGlzIGJlaGF2aW9yLFxuICogdGh1cyB3ZSBzdG9yZSBzdWJqZWN0cyB1bmRlciBkaWZmZXJlbnQgc3ltYm9scy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN5bWJvbDxUPihkZXN0cm95TWV0aG9kTmFtZT86IGtleW9mIFQpOiBzeW1ib2wge1xuICBpZiAodHlwZW9mIGRlc3Ryb3lNZXRob2ROYW1lID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBTeW1ib2woYF9fZGVzdHJveV9fJHtkZXN0cm95TWV0aG9kTmFtZX1gKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gREVTVFJPWTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFya0FzRGVjb3JhdGVkPFQ+KFxuICB0eXBlOiBJbmplY3RhYmxlVHlwZTxUPiB8IFBpcGVUeXBlPFQ+IHwgybVEaXJlY3RpdmVUeXBlPFQ+IHwgybVDb21wb25lbnRUeXBlPFQ+XG4pOiB2b2lkIHtcbiAgLy8gU3RvcmUgdGhpcyBwcm9wZXJ0eSBvbiB0aGUgcHJvdG90eXBlIGlmIGl0J3MgYW4gaW5qZWN0YWJsZSBjbGFzcywgY29tcG9uZW50IG9yIGRpcmVjdGl2ZS5cbiAgLy8gV2Ugd2lsbCBiZSBhYmxlIHRvIGhhbmRsZSBjbGFzcyBleHRlbnNpb24gdGhpcyB3YXkuXG4gIHR5cGUucHJvdG90eXBlW0RFQ09SQVRPUl9BUFBMSUVEXSA9IHRydWU7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVW50aWxEZXN0cm95T3B0aW9ucyB7XG4gIGNsYXNzTmFtZT86IHN0cmluZztcbiAgYmxhY2tMaXN0Pzogc3RyaW5nW107XG4gIGFycmF5TmFtZT86IHN0cmluZztcbiAgY2hlY2tQcm9wZXJ0aWVzPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN1YmplY3RPblRoZUluc3RhbmNlKGluc3RhbmNlOiBhbnksIHN5bWJvbDogc3ltYm9sKTogdm9pZCB7XG4gIGlmICghaW5zdGFuY2Vbc3ltYm9sXSkge1xuICAgIGluc3RhbmNlW3N5bWJvbF0gPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wbGV0ZVN1YmplY3RPblRoZUluc3RhbmNlKGluc3RhbmNlOiBhbnksIHN5bWJvbDogc3ltYm9sKTogdm9pZCB7XG4gIGlmIChpbnN0YW5jZVtzeW1ib2xdKSB7XG4gICAgaW5zdGFuY2Vbc3ltYm9sXS5uZXh0KCk7XG4gICAgaW5zdGFuY2Vbc3ltYm9sXS5jb21wbGV0ZSgpO1xuICAgIC8vIFdlIGFsc28gaGF2ZSB0byByZS1hc3NpZ24gdGhpcyBwcm9wZXJ0eSB0aHVzIGluIHRoZSBmdXR1cmVcbiAgICAvLyB3ZSB3aWxsIGJlIGFibGUgdG8gY3JlYXRlIG5ldyBzdWJqZWN0IG9uIHRoZSBzYW1lIGluc3RhbmNlLlxuICAgIGluc3RhbmNlW3N5bWJvbF0gPSBudWxsO1xuICB9XG59XG4iXX0=