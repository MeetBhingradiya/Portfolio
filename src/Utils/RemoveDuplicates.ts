function removeDuplicates(list: Array<any>) {
    return list.reduce((acc: Array<any>, element: any) => {
        if (element && !acc.includes(element)) return [...acc, element];
        return acc;
    }, []);
}

export { 
    removeDuplicates
};