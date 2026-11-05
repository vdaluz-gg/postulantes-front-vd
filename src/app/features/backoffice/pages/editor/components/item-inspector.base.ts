import { Directive, computed, inject, input } from '@angular/core';
import { EditorStore } from '../../../data/editor.store';
import { ItemList, ItemOf, findItem, moveItem, removeItem, updateItem } from '../../../data/site-config.ops';
import { IslandService } from '../../../ui/bo-island/island.service';

/**
 * Lógica común de los inspectores de documentos, avisos, canales y textos: leer el elemento,
 * cambiarlo (juntando lo que se tipea), moverlo y borrarlo con opción de deshacer.
 */
@Directive()
export abstract class ItemInspectorBase<L extends ItemList> {
  readonly itemId = input.required<string>();

  protected abstract readonly list: L;
  /** Nombre que se muestra en el aviso al borrar. */
  protected abstract name(item: ItemOf<L>): string;

  protected readonly store = inject(EditorStore);
  private readonly island = inject(IslandService);

  protected readonly item = computed(() => {
    const config = this.store.config();
    return config ? findItem(config, this.store.audience(), this.list, this.itemId()) : undefined;
  });

  protected readonly position = computed(() => {
    const items = (this.store.current()?.[this.list] ?? []) as readonly { id: string }[];
    const index = items.findIndex((i) => i.id === this.itemId());
    return { first: index <= 0, last: index === items.length - 1 };
  });

  protected set(patch: Partial<Omit<ItemOf<L>, 'id'>>, key?: string): void {
    const audience = this.store.audience();
    this.store.apply(updateItem(this.store.config()!, audience, this.list, this.itemId(), patch), {
      key: key && `${audience}.${this.list}.${this.itemId()}.${key}`,
    });
  }

  protected move(offset: -1 | 1): void {
    this.store.apply(moveItem(this.store.config()!, this.store.audience(), this.list, this.itemId(), offset));
  }

  protected remove(): void {
    const item = this.item();
    if (!item) return;
    this.store.apply(removeItem(this.store.config()!, this.store.audience(), this.list, this.itemId()));
    this.store.select(null);
    this.island.show(`Borraste «${this.name(item)}».`, { actionLabel: 'Deshacer', action: () => this.store.undo() });
  }
}
