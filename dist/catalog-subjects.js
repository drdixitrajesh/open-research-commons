export function groupedSubjects(subjects) {
  const divisions = new Map();
  for (const division of subjects) {
    if (division.parent === null) divisions.set(division.code, { division, groups: [] });
  }
  for (const group of subjects) {
    if (group.code.length === 4) divisions.get(group.parent)?.groups.push(group);
  }
  return [...divisions.values()];
}

export function subjectFields(subjects, parent) {
  if (parent?.length !== 4) return [];
  return subjects.filter(subject => subject.code.length === 6 && subject.parent === parent);
}
