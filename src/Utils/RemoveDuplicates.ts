/**
 * Removes duplicate elements from the input array.
 *
 * This function converts the array into a Set to automatically filter out duplicates,
 * then returns a new array containing only unique values.
 *
 * @param list - The array to process for duplicate removal.
 * @returns A new array containing only the unique elements from the original array.
 */


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