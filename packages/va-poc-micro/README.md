# VA-POC (micro)

This package provides only the core components of the LD based VA:

- A step-displayer for tasks, as gathered from processes, assuming it is available as RDF
- A search-displayer for ?s node finding if these are to be entered in the form
- A displayer of the resulting Things (made available as RDF to export)

The only two process tasks supported are:

1. (Process: Organisations.ttl) Enter ORGS and SITES, enabling them also to be linked
2. (Process: EurLex.ttl) Retrieve and edit EURLEX data

The processes are assumed to be hosted on Github, under fixed (configurable) URLs.
