// Very partial vocab for PoC purposes
// Source of all http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#
const _NAMESPACE = 'http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#'
const _NS = (localName: string): string => {
  return _NAMESPACE + localName
}

export const DUL = {
  PREFIX: 'dul',
  NAMESPACE: _NAMESPACE,
  PREFIX_AND_NAMESPACE: { dul: 'http://www.ontologydesignpatterns.org/ont/dul/DUL.owl#' },
  NS: _NS,

  // *****************
  // All the Classes.
  // *****************
  Action: _NS('Action'),
  Description: _NS('Description'),
  Process: _NS('Process'),
  Role: _NS('Role'),
  Task: _NS('Task'),
  definesTask: _NS('definesTask'),  // Description definesTask Task
  executesTask: _NS('executesTask'), // Action executesTask Task
  isExecutedIn: _NS('isExecutedIn'), // Task isExecutedIn Action
  hasTask: _NS('hasTask'), // Role hasTask Task
  isTaskOf: _NS('isTaskOf'), // Task isTaskOf Role
}