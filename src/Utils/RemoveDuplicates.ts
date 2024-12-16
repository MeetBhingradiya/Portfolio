function removeDuplicates(list: Array<any>) {

    // ! Old method
    // return list.reduce((acc: Array<any>, element: any) => {
    //     if (element && !acc.includes(element)) return [...acc, element];
    //     return acc;
    // }, []);

    // @ New method
    return Array.from(new Set(list));
}

export { 
    removeDuplicates
};