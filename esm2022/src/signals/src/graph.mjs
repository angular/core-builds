/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { newWeakRef } from './weak_ref';
/**
 * Counter tracking the next `ProducerId` or `ConsumerId`.
 */
let _nextReactiveId = 0;
/**
 * Tracks the currently active reactive consumer (or `null` if there is no active
 * consumer).
 */
let activeConsumer = null;
export function setActiveConsumer(consumer) {
    const prev = activeConsumer;
    activeConsumer = consumer;
    return prev;
}
/**
 * A node in the reactive graph.
 *
 * Nodes can be producers of reactive values, consumers of other reactive values, or both.
 *
 * Producers are nodes that produce values, and can be depended upon by consumer nodes.
 *
 * Producers expose a monotonic `valueVersion` counter, and are responsible for incrementing this
 * version when their value semantically changes. Some producers may produce their values lazily and
 * thus at times need to be polled for potential updates to their value (and by extension their
 * `valueVersion`). This is accomplished via the `onProducerUpdateValueVersion` method for
 * implemented by producers, which should perform whatever calculations are necessary to ensure
 * `valueVersion` is up to date.
 *
 * Consumers are nodes that depend on the values of producers and are notified when those values
 * might have changed.
 *
 * Consumers do not wrap the reads they consume themselves, but rather can be set as the active
 * reader via `setActiveConsumer`. Reads of producers that happen while a consumer is active will
 * result in those producers being added as dependencies of that consumer node.
 *
 * The set of dependencies of a consumer is dynamic. Implementers expose a monotonically increasing
 * `trackingVersion` counter, which increments whenever the consumer is about to re-run any reactive
 * reads it needs and establish a new set of dependencies as a result.
 *
 * Producers store the last `trackingVersion` they've seen from `Consumer`s which have read them.
 * This allows a producer to identify whether its record of the dependency is current or stale, by
 * comparing the consumer's `trackingVersion` to the version at which the dependency was
 * last observed.
 */
export class ReactiveNode {
    constructor() {
        this.id = _nextReactiveId++;
        /**
         * A cached weak reference to this node, which will be used in `ReactiveEdge`s.
         */
        this.ref = newWeakRef(this);
        /**
         * Edges to producers on which this node depends (in its consumer capacity).
         */
        this.producers = new Map();
        /**
         * Edges to consumers on which this node depends (in its producer capacity).
         */
        this.consumers = new Map();
        /**
         * Monotonically increasing counter representing a version of this `Consumer`'s
         * dependencies.
         */
        this.trackingVersion = 0;
        /**
         * Monotonically increasing counter which increases when the value of this `Producer`
         * semantically changes.
         */
        this.valueVersion = 0;
    }
    /**
     * Polls dependencies of a consumer to determine if they have actually changed.
     *
     * If this returns `false`, then even though the consumer may have previously been notified of a
     * change, the values of its dependencies have not actually changed and the consumer should not
     * rerun any reactions.
     */
    consumerPollProducersForChange() {
        for (const [producerId, edge] of this.producers) {
            const producer = edge.producerNode.deref();
            if (producer === undefined || edge.atTrackingVersion !== this.trackingVersion) {
                // This dependency edge is stale, so remove it.
                this.producers.delete(producerId);
                producer?.consumers.delete(this.id);
                continue;
            }
            if (producer.producerPollStatus(edge.seenValueVersion)) {
                // One of the dependencies reports a real value change.
                return true;
            }
        }
        // No dependency reported a real value change, so the `Consumer` has also not been
        // impacted.
        return false;
    }
    /**
     * Notify all consumers of this producer that its value may have changed.
     */
    producerMayHaveChanged() {
        for (const [consumerId, edge] of this.consumers) {
            const consumer = edge.consumerNode.deref();
            if (consumer === undefined || consumer.trackingVersion !== edge.atTrackingVersion) {
                this.consumers.delete(consumerId);
                consumer?.producers.delete(this.id);
                continue;
            }
            consumer.onConsumerDependencyMayHaveChanged();
        }
    }
    /**
     * Mark that this producer node has been accessed in the current reactive context.
     */
    producerAccessed() {
        if (activeConsumer === null) {
            return;
        }
        // Either create or update the dependency `Edge` in both directions.
        let edge = activeConsumer.producers.get(this.id);
        if (edge === undefined) {
            edge = {
                consumerNode: activeConsumer.ref,
                producerNode: this.ref,
                seenValueVersion: this.valueVersion,
                atTrackingVersion: activeConsumer.trackingVersion,
            };
            activeConsumer.producers.set(this.id, edge);
            this.consumers.set(activeConsumer.id, edge);
        }
        else {
            edge.seenValueVersion = this.valueVersion;
            edge.atTrackingVersion = activeConsumer.trackingVersion;
        }
    }
    /**
     * Whether this consumer currently has any producers registered.
     */
    get hasProducers() {
        return this.producers.size > 0;
    }
    /**
     * Checks if a `Producer` has a current value which is different than the value
     * last seen at a specific version by a `Consumer` which recorded a dependency on
     * this `Producer`.
     */
    producerPollStatus(lastSeenValueVersion) {
        // `producer.valueVersion` may be stale, but a mismatch still means that the value
        // last seen by the `Consumer` is also stale.
        if (this.valueVersion !== lastSeenValueVersion) {
            return true;
        }
        // Trigger the `Producer` to update its `valueVersion` if necessary.
        this.onProducerUpdateValueVersion();
        // At this point, we can trust `producer.valueVersion`.
        return this.valueVersion !== lastSeenValueVersion;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhcGguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zaWduYWxzL3NyYy9ncmFwaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsVUFBVSxFQUFVLE1BQU0sWUFBWSxDQUFDO0FBRS9DOztHQUVHO0FBQ0gsSUFBSSxlQUFlLEdBQVcsQ0FBQyxDQUFDO0FBRWhDOzs7R0FHRztBQUNILElBQUksY0FBYyxHQUFzQixJQUFJLENBQUM7QUFFN0MsTUFBTSxVQUFVLGlCQUFpQixDQUFDLFFBQTJCO0lBQzNELE1BQU0sSUFBSSxHQUFHLGNBQWMsQ0FBQztJQUM1QixjQUFjLEdBQUcsUUFBUSxDQUFDO0lBQzFCLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQTZCRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0E2Qkc7QUFDSCxNQUFNLE9BQWdCLFlBQVk7SUFBbEM7UUFDbUIsT0FBRSxHQUFHLGVBQWUsRUFBRSxDQUFDO1FBRXhDOztXQUVHO1FBQ2MsUUFBRyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV4Qzs7V0FFRztRQUNjLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBd0IsQ0FBQztRQUU3RDs7V0FFRztRQUNjLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBd0IsQ0FBQztRQUU3RDs7O1dBR0c7UUFDTyxvQkFBZSxHQUFHLENBQUMsQ0FBQztRQUU5Qjs7O1dBR0c7UUFDTyxpQkFBWSxHQUFHLENBQUMsQ0FBQztJQTZHN0IsQ0FBQztJQS9GQzs7Ozs7O09BTUc7SUFDTyw4QkFBOEI7UUFDdEMsS0FBSyxNQUFNLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFDL0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUUzQyxJQUFJLFFBQVEsS0FBSyxTQUFTLElBQUksSUFBSSxDQUFDLGlCQUFpQixLQUFLLElBQUksQ0FBQyxlQUFlLEVBQUU7Z0JBQzdFLCtDQUErQztnQkFDL0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2xDLFFBQVEsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDcEMsU0FBUzthQUNWO1lBRUQsSUFBSSxRQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7Z0JBQ3RELHVEQUF1RDtnQkFDdkQsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO1FBRUQsa0ZBQWtGO1FBQ2xGLFlBQVk7UUFDWixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRDs7T0FFRztJQUNPLHNCQUFzQjtRQUM5QixLQUFLLE1BQU0sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUMvQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzNDLElBQUksUUFBUSxLQUFLLFNBQVMsSUFBSSxRQUFRLENBQUMsZUFBZSxLQUFLLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDakYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2xDLFFBQVEsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDcEMsU0FBUzthQUNWO1lBRUQsUUFBUSxDQUFDLGtDQUFrQyxFQUFFLENBQUM7U0FDL0M7SUFDSCxDQUFDO0lBRUQ7O09BRUc7SUFDTyxnQkFBZ0I7UUFDeEIsSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO1lBQzNCLE9BQU87U0FDUjtRQUVELG9FQUFvRTtRQUNwRSxJQUFJLElBQUksR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakQsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO1lBQ3RCLElBQUksR0FBRztnQkFDTCxZQUFZLEVBQUUsY0FBYyxDQUFDLEdBQUc7Z0JBQ2hDLFlBQVksRUFBRSxJQUFJLENBQUMsR0FBRztnQkFDdEIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVk7Z0JBQ25DLGlCQUFpQixFQUFFLGNBQWMsQ0FBQyxlQUFlO2FBQ2xELENBQUM7WUFDRixjQUFjLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDN0M7YUFBTTtZQUNMLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQzFDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFDO1NBQ3pEO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBYyxZQUFZO1FBQ3hCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ssa0JBQWtCLENBQUMsb0JBQTRCO1FBQ3JELGtGQUFrRjtRQUNsRiw2Q0FBNkM7UUFDN0MsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLG9CQUFvQixFQUFFO1lBQzlDLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFFRCxvRUFBb0U7UUFDcEUsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7UUFFcEMsdURBQXVEO1FBQ3ZELE9BQU8sSUFBSSxDQUFDLFlBQVksS0FBSyxvQkFBb0IsQ0FBQztJQUNwRCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtuZXdXZWFrUmVmLCBXZWFrUmVmfSBmcm9tICcuL3dlYWtfcmVmJztcblxuLyoqXG4gKiBDb3VudGVyIHRyYWNraW5nIHRoZSBuZXh0IGBQcm9kdWNlcklkYCBvciBgQ29uc3VtZXJJZGAuXG4gKi9cbmxldCBfbmV4dFJlYWN0aXZlSWQ6IG51bWJlciA9IDA7XG5cbi8qKlxuICogVHJhY2tzIHRoZSBjdXJyZW50bHkgYWN0aXZlIHJlYWN0aXZlIGNvbnN1bWVyIChvciBgbnVsbGAgaWYgdGhlcmUgaXMgbm8gYWN0aXZlXG4gKiBjb25zdW1lcikuXG4gKi9cbmxldCBhY3RpdmVDb25zdW1lcjogUmVhY3RpdmVOb2RlfG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0QWN0aXZlQ29uc3VtZXIoY29uc3VtZXI6IFJlYWN0aXZlTm9kZXxudWxsKTogUmVhY3RpdmVOb2RlfG51bGwge1xuICBjb25zdCBwcmV2ID0gYWN0aXZlQ29uc3VtZXI7XG4gIGFjdGl2ZUNvbnN1bWVyID0gY29uc3VtZXI7XG4gIHJldHVybiBwcmV2O1xufVxuXG4vKipcbiAqIEEgYmlkaXJlY3Rpb25hbCBlZGdlIGluIHRoZSBkZXBlbmRlbmN5IGdyYXBoIG9mIGBSZWFjdGl2ZU5vZGVgcy5cbiAqL1xuaW50ZXJmYWNlIFJlYWN0aXZlRWRnZSB7XG4gIC8qKlxuICAgKiBXZWFrbHkgaGVsZCByZWZlcmVuY2UgdG8gdGhlIGNvbnN1bWVyIHNpZGUgb2YgdGhpcyBlZGdlLlxuICAgKi9cbiAgcmVhZG9ubHkgcHJvZHVjZXJOb2RlOiBXZWFrUmVmPFJlYWN0aXZlTm9kZT47XG5cbiAgLyoqXG4gICAqIFdlYWtseSBoZWxkIHJlZmVyZW5jZSB0byB0aGUgcHJvZHVjZXIgc2lkZSBvZiB0aGlzIGVkZ2UuXG4gICAqL1xuICByZWFkb25seSBjb25zdW1lck5vZGU6IFdlYWtSZWY8UmVhY3RpdmVOb2RlPjtcbiAgLyoqXG4gICAqIGB0cmFja2luZ1ZlcnNpb25gIG9mIHRoZSBjb25zdW1lciBhdCB3aGljaCB0aGlzIGRlcGVuZGVuY3kgZWRnZSB3YXMgbGFzdCBvYnNlcnZlZC5cbiAgICpcbiAgICogSWYgdGhpcyBkb2Vzbid0IG1hdGNoIHRoZSBjb25zdW1lcidzIGN1cnJlbnQgYHRyYWNraW5nVmVyc2lvbmAsIHRoZW4gdGhpcyBkZXBlbmRlbmN5IHJlY29yZFxuICAgKiBpcyBzdGFsZSwgYW5kIG5lZWRzIHRvIGJlIGNsZWFuZWQgdXAuXG4gICAqL1xuICBhdFRyYWNraW5nVmVyc2lvbjogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBgdmFsdWVWZXJzaW9uYCBvZiB0aGUgcHJvZHVjZXIgYXQgdGhlIHRpbWUgdGhpcyBkZXBlbmRlbmN5IHdhcyBsYXN0IGFjY2Vzc2VkLlxuICAgKi9cbiAgc2VlblZhbHVlVmVyc2lvbjogbnVtYmVyO1xufVxuXG4vKipcbiAqIEEgbm9kZSBpbiB0aGUgcmVhY3RpdmUgZ3JhcGguXG4gKlxuICogTm9kZXMgY2FuIGJlIHByb2R1Y2VycyBvZiByZWFjdGl2ZSB2YWx1ZXMsIGNvbnN1bWVycyBvZiBvdGhlciByZWFjdGl2ZSB2YWx1ZXMsIG9yIGJvdGguXG4gKlxuICogUHJvZHVjZXJzIGFyZSBub2RlcyB0aGF0IHByb2R1Y2UgdmFsdWVzLCBhbmQgY2FuIGJlIGRlcGVuZGVkIHVwb24gYnkgY29uc3VtZXIgbm9kZXMuXG4gKlxuICogUHJvZHVjZXJzIGV4cG9zZSBhIG1vbm90b25pYyBgdmFsdWVWZXJzaW9uYCBjb3VudGVyLCBhbmQgYXJlIHJlc3BvbnNpYmxlIGZvciBpbmNyZW1lbnRpbmcgdGhpc1xuICogdmVyc2lvbiB3aGVuIHRoZWlyIHZhbHVlIHNlbWFudGljYWxseSBjaGFuZ2VzLiBTb21lIHByb2R1Y2VycyBtYXkgcHJvZHVjZSB0aGVpciB2YWx1ZXMgbGF6aWx5IGFuZFxuICogdGh1cyBhdCB0aW1lcyBuZWVkIHRvIGJlIHBvbGxlZCBmb3IgcG90ZW50aWFsIHVwZGF0ZXMgdG8gdGhlaXIgdmFsdWUgKGFuZCBieSBleHRlbnNpb24gdGhlaXJcbiAqIGB2YWx1ZVZlcnNpb25gKS4gVGhpcyBpcyBhY2NvbXBsaXNoZWQgdmlhIHRoZSBgb25Qcm9kdWNlclVwZGF0ZVZhbHVlVmVyc2lvbmAgbWV0aG9kIGZvclxuICogaW1wbGVtZW50ZWQgYnkgcHJvZHVjZXJzLCB3aGljaCBzaG91bGQgcGVyZm9ybSB3aGF0ZXZlciBjYWxjdWxhdGlvbnMgYXJlIG5lY2Vzc2FyeSB0byBlbnN1cmVcbiAqIGB2YWx1ZVZlcnNpb25gIGlzIHVwIHRvIGRhdGUuXG4gKlxuICogQ29uc3VtZXJzIGFyZSBub2RlcyB0aGF0IGRlcGVuZCBvbiB0aGUgdmFsdWVzIG9mIHByb2R1Y2VycyBhbmQgYXJlIG5vdGlmaWVkIHdoZW4gdGhvc2UgdmFsdWVzXG4gKiBtaWdodCBoYXZlIGNoYW5nZWQuXG4gKlxuICogQ29uc3VtZXJzIGRvIG5vdCB3cmFwIHRoZSByZWFkcyB0aGV5IGNvbnN1bWUgdGhlbXNlbHZlcywgYnV0IHJhdGhlciBjYW4gYmUgc2V0IGFzIHRoZSBhY3RpdmVcbiAqIHJlYWRlciB2aWEgYHNldEFjdGl2ZUNvbnN1bWVyYC4gUmVhZHMgb2YgcHJvZHVjZXJzIHRoYXQgaGFwcGVuIHdoaWxlIGEgY29uc3VtZXIgaXMgYWN0aXZlIHdpbGxcbiAqIHJlc3VsdCBpbiB0aG9zZSBwcm9kdWNlcnMgYmVpbmcgYWRkZWQgYXMgZGVwZW5kZW5jaWVzIG9mIHRoYXQgY29uc3VtZXIgbm9kZS5cbiAqXG4gKiBUaGUgc2V0IG9mIGRlcGVuZGVuY2llcyBvZiBhIGNvbnN1bWVyIGlzIGR5bmFtaWMuIEltcGxlbWVudGVycyBleHBvc2UgYSBtb25vdG9uaWNhbGx5IGluY3JlYXNpbmdcbiAqIGB0cmFja2luZ1ZlcnNpb25gIGNvdW50ZXIsIHdoaWNoIGluY3JlbWVudHMgd2hlbmV2ZXIgdGhlIGNvbnN1bWVyIGlzIGFib3V0IHRvIHJlLXJ1biBhbnkgcmVhY3RpdmVcbiAqIHJlYWRzIGl0IG5lZWRzIGFuZCBlc3RhYmxpc2ggYSBuZXcgc2V0IG9mIGRlcGVuZGVuY2llcyBhcyBhIHJlc3VsdC5cbiAqXG4gKiBQcm9kdWNlcnMgc3RvcmUgdGhlIGxhc3QgYHRyYWNraW5nVmVyc2lvbmAgdGhleSd2ZSBzZWVuIGZyb20gYENvbnN1bWVyYHMgd2hpY2ggaGF2ZSByZWFkIHRoZW0uXG4gKiBUaGlzIGFsbG93cyBhIHByb2R1Y2VyIHRvIGlkZW50aWZ5IHdoZXRoZXIgaXRzIHJlY29yZCBvZiB0aGUgZGVwZW5kZW5jeSBpcyBjdXJyZW50IG9yIHN0YWxlLCBieVxuICogY29tcGFyaW5nIHRoZSBjb25zdW1lcidzIGB0cmFja2luZ1ZlcnNpb25gIHRvIHRoZSB2ZXJzaW9uIGF0IHdoaWNoIHRoZSBkZXBlbmRlbmN5IHdhc1xuICogbGFzdCBvYnNlcnZlZC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFJlYWN0aXZlTm9kZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgaWQgPSBfbmV4dFJlYWN0aXZlSWQrKztcblxuICAvKipcbiAgICogQSBjYWNoZWQgd2VhayByZWZlcmVuY2UgdG8gdGhpcyBub2RlLCB3aGljaCB3aWxsIGJlIHVzZWQgaW4gYFJlYWN0aXZlRWRnZWBzLlxuICAgKi9cbiAgcHJpdmF0ZSByZWFkb25seSByZWYgPSBuZXdXZWFrUmVmKHRoaXMpO1xuXG4gIC8qKlxuICAgKiBFZGdlcyB0byBwcm9kdWNlcnMgb24gd2hpY2ggdGhpcyBub2RlIGRlcGVuZHMgKGluIGl0cyBjb25zdW1lciBjYXBhY2l0eSkuXG4gICAqL1xuICBwcml2YXRlIHJlYWRvbmx5IHByb2R1Y2VycyA9IG5ldyBNYXA8bnVtYmVyLCBSZWFjdGl2ZUVkZ2U+KCk7XG5cbiAgLyoqXG4gICAqIEVkZ2VzIHRvIGNvbnN1bWVycyBvbiB3aGljaCB0aGlzIG5vZGUgZGVwZW5kcyAoaW4gaXRzIHByb2R1Y2VyIGNhcGFjaXR5KS5cbiAgICovXG4gIHByaXZhdGUgcmVhZG9ubHkgY29uc3VtZXJzID0gbmV3IE1hcDxudW1iZXIsIFJlYWN0aXZlRWRnZT4oKTtcblxuICAvKipcbiAgICogTW9ub3RvbmljYWxseSBpbmNyZWFzaW5nIGNvdW50ZXIgcmVwcmVzZW50aW5nIGEgdmVyc2lvbiBvZiB0aGlzIGBDb25zdW1lcmAnc1xuICAgKiBkZXBlbmRlbmNpZXMuXG4gICAqL1xuICBwcm90ZWN0ZWQgdHJhY2tpbmdWZXJzaW9uID0gMDtcblxuICAvKipcbiAgICogTW9ub3RvbmljYWxseSBpbmNyZWFzaW5nIGNvdW50ZXIgd2hpY2ggaW5jcmVhc2VzIHdoZW4gdGhlIHZhbHVlIG9mIHRoaXMgYFByb2R1Y2VyYFxuICAgKiBzZW1hbnRpY2FsbHkgY2hhbmdlcy5cbiAgICovXG4gIHByb3RlY3RlZCB2YWx1ZVZlcnNpb24gPSAwO1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgZm9yIGNvbnN1bWVycyB3aGVuZXZlciBvbmUgb2YgdGhlaXIgZGVwZW5kZW5jaWVzIG5vdGlmaWVzIHRoYXQgaXQgbWlnaHQgaGF2ZSBhIG5ld1xuICAgKiB2YWx1ZS5cbiAgICovXG4gIHByb3RlY3RlZCBhYnN0cmFjdCBvbkNvbnN1bWVyRGVwZW5kZW5jeU1heUhhdmVDaGFuZ2VkKCk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIENhbGxlZCBmb3IgcHJvZHVjZXJzIHdoZW4gYSBkZXBlbmRlbnQgY29uc3VtZXIgaXMgY2hlY2tpbmcgaWYgdGhlIHByb2R1Y2VyJ3MgdmFsdWUgaGFzIGFjdHVhbGx5XG4gICAqIGNoYW5nZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgYWJzdHJhY3Qgb25Qcm9kdWNlclVwZGF0ZVZhbHVlVmVyc2lvbigpOiB2b2lkO1xuXG4gIC8qKlxuICAgKiBQb2xscyBkZXBlbmRlbmNpZXMgb2YgYSBjb25zdW1lciB0byBkZXRlcm1pbmUgaWYgdGhleSBoYXZlIGFjdHVhbGx5IGNoYW5nZWQuXG4gICAqXG4gICAqIElmIHRoaXMgcmV0dXJucyBgZmFsc2VgLCB0aGVuIGV2ZW4gdGhvdWdoIHRoZSBjb25zdW1lciBtYXkgaGF2ZSBwcmV2aW91c2x5IGJlZW4gbm90aWZpZWQgb2YgYVxuICAgKiBjaGFuZ2UsIHRoZSB2YWx1ZXMgb2YgaXRzIGRlcGVuZGVuY2llcyBoYXZlIG5vdCBhY3R1YWxseSBjaGFuZ2VkIGFuZCB0aGUgY29uc3VtZXIgc2hvdWxkIG5vdFxuICAgKiByZXJ1biBhbnkgcmVhY3Rpb25zLlxuICAgKi9cbiAgcHJvdGVjdGVkIGNvbnN1bWVyUG9sbFByb2R1Y2Vyc0ZvckNoYW5nZSgpOiBib29sZWFuIHtcbiAgICBmb3IgKGNvbnN0IFtwcm9kdWNlcklkLCBlZGdlXSBvZiB0aGlzLnByb2R1Y2Vycykge1xuICAgICAgY29uc3QgcHJvZHVjZXIgPSBlZGdlLnByb2R1Y2VyTm9kZS5kZXJlZigpO1xuXG4gICAgICBpZiAocHJvZHVjZXIgPT09IHVuZGVmaW5lZCB8fCBlZGdlLmF0VHJhY2tpbmdWZXJzaW9uICE9PSB0aGlzLnRyYWNraW5nVmVyc2lvbikge1xuICAgICAgICAvLyBUaGlzIGRlcGVuZGVuY3kgZWRnZSBpcyBzdGFsZSwgc28gcmVtb3ZlIGl0LlxuICAgICAgICB0aGlzLnByb2R1Y2Vycy5kZWxldGUocHJvZHVjZXJJZCk7XG4gICAgICAgIHByb2R1Y2VyPy5jb25zdW1lcnMuZGVsZXRlKHRoaXMuaWQpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHByb2R1Y2VyLnByb2R1Y2VyUG9sbFN0YXR1cyhlZGdlLnNlZW5WYWx1ZVZlcnNpb24pKSB7XG4gICAgICAgIC8vIE9uZSBvZiB0aGUgZGVwZW5kZW5jaWVzIHJlcG9ydHMgYSByZWFsIHZhbHVlIGNoYW5nZS5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTm8gZGVwZW5kZW5jeSByZXBvcnRlZCBhIHJlYWwgdmFsdWUgY2hhbmdlLCBzbyB0aGUgYENvbnN1bWVyYCBoYXMgYWxzbyBub3QgYmVlblxuICAgIC8vIGltcGFjdGVkLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3RpZnkgYWxsIGNvbnN1bWVycyBvZiB0aGlzIHByb2R1Y2VyIHRoYXQgaXRzIHZhbHVlIG1heSBoYXZlIGNoYW5nZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgcHJvZHVjZXJNYXlIYXZlQ2hhbmdlZCgpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IFtjb25zdW1lcklkLCBlZGdlXSBvZiB0aGlzLmNvbnN1bWVycykge1xuICAgICAgY29uc3QgY29uc3VtZXIgPSBlZGdlLmNvbnN1bWVyTm9kZS5kZXJlZigpO1xuICAgICAgaWYgKGNvbnN1bWVyID09PSB1bmRlZmluZWQgfHwgY29uc3VtZXIudHJhY2tpbmdWZXJzaW9uICE9PSBlZGdlLmF0VHJhY2tpbmdWZXJzaW9uKSB7XG4gICAgICAgIHRoaXMuY29uc3VtZXJzLmRlbGV0ZShjb25zdW1lcklkKTtcbiAgICAgICAgY29uc3VtZXI/LnByb2R1Y2Vycy5kZWxldGUodGhpcy5pZCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdW1lci5vbkNvbnN1bWVyRGVwZW5kZW5jeU1heUhhdmVDaGFuZ2VkKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1hcmsgdGhhdCB0aGlzIHByb2R1Y2VyIG5vZGUgaGFzIGJlZW4gYWNjZXNzZWQgaW4gdGhlIGN1cnJlbnQgcmVhY3RpdmUgY29udGV4dC5cbiAgICovXG4gIHByb3RlY3RlZCBwcm9kdWNlckFjY2Vzc2VkKCk6IHZvaWQge1xuICAgIGlmIChhY3RpdmVDb25zdW1lciA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEVpdGhlciBjcmVhdGUgb3IgdXBkYXRlIHRoZSBkZXBlbmRlbmN5IGBFZGdlYCBpbiBib3RoIGRpcmVjdGlvbnMuXG4gICAgbGV0IGVkZ2UgPSBhY3RpdmVDb25zdW1lci5wcm9kdWNlcnMuZ2V0KHRoaXMuaWQpO1xuICAgIGlmIChlZGdlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGVkZ2UgPSB7XG4gICAgICAgIGNvbnN1bWVyTm9kZTogYWN0aXZlQ29uc3VtZXIucmVmLFxuICAgICAgICBwcm9kdWNlck5vZGU6IHRoaXMucmVmLFxuICAgICAgICBzZWVuVmFsdWVWZXJzaW9uOiB0aGlzLnZhbHVlVmVyc2lvbixcbiAgICAgICAgYXRUcmFja2luZ1ZlcnNpb246IGFjdGl2ZUNvbnN1bWVyLnRyYWNraW5nVmVyc2lvbixcbiAgICAgIH07XG4gICAgICBhY3RpdmVDb25zdW1lci5wcm9kdWNlcnMuc2V0KHRoaXMuaWQsIGVkZ2UpO1xuICAgICAgdGhpcy5jb25zdW1lcnMuc2V0KGFjdGl2ZUNvbnN1bWVyLmlkLCBlZGdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWRnZS5zZWVuVmFsdWVWZXJzaW9uID0gdGhpcy52YWx1ZVZlcnNpb247XG4gICAgICBlZGdlLmF0VHJhY2tpbmdWZXJzaW9uID0gYWN0aXZlQ29uc3VtZXIudHJhY2tpbmdWZXJzaW9uO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoaXMgY29uc3VtZXIgY3VycmVudGx5IGhhcyBhbnkgcHJvZHVjZXJzIHJlZ2lzdGVyZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0IGhhc1Byb2R1Y2VycygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5wcm9kdWNlcnMuc2l6ZSA+IDA7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgYFByb2R1Y2VyYCBoYXMgYSBjdXJyZW50IHZhbHVlIHdoaWNoIGlzIGRpZmZlcmVudCB0aGFuIHRoZSB2YWx1ZVxuICAgKiBsYXN0IHNlZW4gYXQgYSBzcGVjaWZpYyB2ZXJzaW9uIGJ5IGEgYENvbnN1bWVyYCB3aGljaCByZWNvcmRlZCBhIGRlcGVuZGVuY3kgb25cbiAgICogdGhpcyBgUHJvZHVjZXJgLlxuICAgKi9cbiAgcHJpdmF0ZSBwcm9kdWNlclBvbGxTdGF0dXMobGFzdFNlZW5WYWx1ZVZlcnNpb246IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIC8vIGBwcm9kdWNlci52YWx1ZVZlcnNpb25gIG1heSBiZSBzdGFsZSwgYnV0IGEgbWlzbWF0Y2ggc3RpbGwgbWVhbnMgdGhhdCB0aGUgdmFsdWVcbiAgICAvLyBsYXN0IHNlZW4gYnkgdGhlIGBDb25zdW1lcmAgaXMgYWxzbyBzdGFsZS5cbiAgICBpZiAodGhpcy52YWx1ZVZlcnNpb24gIT09IGxhc3RTZWVuVmFsdWVWZXJzaW9uKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBUcmlnZ2VyIHRoZSBgUHJvZHVjZXJgIHRvIHVwZGF0ZSBpdHMgYHZhbHVlVmVyc2lvbmAgaWYgbmVjZXNzYXJ5LlxuICAgIHRoaXMub25Qcm9kdWNlclVwZGF0ZVZhbHVlVmVyc2lvbigpO1xuXG4gICAgLy8gQXQgdGhpcyBwb2ludCwgd2UgY2FuIHRydXN0IGBwcm9kdWNlci52YWx1ZVZlcnNpb25gLlxuICAgIHJldHVybiB0aGlzLnZhbHVlVmVyc2lvbiAhPT0gbGFzdFNlZW5WYWx1ZVZlcnNpb247XG4gIH1cbn1cbiJdfQ==