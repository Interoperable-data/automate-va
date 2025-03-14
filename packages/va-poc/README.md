# va-poc

## Aim

This part of the repository aims to provide the Vue-based Custom Element Library which allows for:

- [ ] Connecting to a LWS Provider, in order to store the linked data from the processes in appropriate containers;
- [ ] Create ResourceCollections, as sets of `Things` belonging together (usage: application libraries);
- [ ] Create individual `Things` based on their SHACL-shape (usage: creation of CLDs, declarations, applications, registrations etc)
- [ ] Search for Things in triple stores and other LWS, in order to procure their URI and link it (usage: CLD's organisations, legal references, etc)
- [ ] Create the `org:Organization` for the LWS owner itself, including `org:Unit`s and `org:Site`s, and providing the link to Agents executing a `org:Role` for the Organisation.

This Proof of Concept must allow for the validation of linked data technologies as used in other programs.

## Technologies

- [ ] Inrupt's libraries to access, read, write and update `Things` in `SolidDatasets`.
- [ ] Soukai and `soukai-solid` in order to model Users, Organisations and Sites, and allowing storage in LWS
- [ ] `ldkit` and `ldflex` in order to execute operations on linked data
- [ ] `<shacl-form>` for the creation of forms based on a rewrite of the resources' SHACL shape.
- [ ] Vue3 [Custom Elements](https://vuejs.org/guide/extras/web-components.html#building-custom-elements-with-vue) in order to allow integration elsewhere.