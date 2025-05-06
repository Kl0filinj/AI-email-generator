export const removeMiddleName = (name: string, reverse = true) => {
  const splittedName = name.trim().split(/\s+/);
  const formatName = (arr: string[]) => {
    const nameArr = reverse ? arr.reverse() : arr;
    return nameArr.join(' ').replace(/[^a-zA-Z\s]/g, '');
  };

  if (splittedName.length === 2) {
    return formatName(splittedName);
  }

  return formatName(
    [splittedName[0], splittedName[splittedName.length - 1]].filter(Boolean),
  );
};
