import type { ShapeDescriptor } from '../data/shape-descriptors';
import type { ResourceRecord } from './resource-manager-shared';

export interface ColumnCopy {
  title: string;
  description: string;
  empty: string;
}

export interface ColumnDefinition {
  key: string;
  host: HTMLElement;
  descriptors: ShapeDescriptor[];
  copy: ColumnCopy;
}

export interface ColumnRenderOptions {
  onSelect: (resource: ResourceRecord) => void;
  onCreate: (descriptor: ShapeDescriptor) => void;
  highlightSubject?: string;
}

/**
 * Renders a list of resource buttons grouped by descriptor within a set of column hosts.
 * The same renderer can be reused by other views that expose a column-based layout.
 */
export function renderResourceColumns(
  definitions: ColumnDefinition[],
  items: ResourceRecord[],
  options: ColumnRenderOptions
): void {
  definitions.forEach((definition) => {
    const { host, descriptors, copy } = definition;
    host.replaceChildren();

    if (descriptors.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'resource-list__column-empty';
      empty.textContent = copy.empty;
      host.append(empty);
      return;
    }

    descriptors.forEach((descriptor) => {
      const subset = items.filter((item) => item.descriptor.shape.equals(descriptor.shape));

      const section = document.createElement('section');
      section.className = 'resource-list__group';

      const heading = document.createElement('h4');
      heading.className = 'resource-list__heading';
      heading.textContent = descriptor.pluralLabel;
      section.append(heading);

      const sectionDescription = document.createElement('p');
      sectionDescription.className = 'resource-list__description';
      sectionDescription.textContent = descriptor.description;
      section.append(sectionDescription);

      if (subset.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'resource-list__empty';
        empty.textContent = `No ${descriptor.pluralLabel.toLowerCase()} stored yet.`;
        section.append(empty);
      } else {
        const list = document.createElement('ul');
        list.className = 'resource-list__items';

        subset.forEach((resource) => {
          const listItem = document.createElement('li');
          listItem.className = 'resource-list__item';

          const button = document.createElement('button');
          button.className = 'resource-list__button';
          button.type = 'button';
          button.dataset.subject = resource.subject;
          button.textContent = resource.label;
          if (resource.expired) {
            button.classList.add('resource-list__button--expired');
            button.style.textDecoration = 'line-through';
            button.title = `${resource.label} (expired)`;
          }
          if (options.highlightSubject && options.highlightSubject === resource.subject) {
            button.classList.add('is-active');
          }

          button.addEventListener('click', () => options.onSelect(resource));

          listItem.append(button);
          list.append(listItem);
        });

        section.append(list);
      }

      const createButton = document.createElement('button');
      createButton.type = 'button';
      createButton.className = 'panel__button resource-list__create';
      createButton.textContent = descriptor.createButtonLabel;
      createButton.addEventListener('click', () => options.onCreate(descriptor));
      section.append(createButton);

      host.append(section);
    });
  });
}
