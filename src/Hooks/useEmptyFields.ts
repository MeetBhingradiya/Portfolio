interface IuseEmptyFields {
    ReqiuredFields: Array<string>
    Object: any
}

interface useEmptyFields_Return {
    isMising: boolean
    MissingFields: Array<string>
    Length: number
}

/**
 * ? check in object if the required fields are present in the object.
 */
function useEmptyFields({
    ReqiuredFields,
    Object
}: IuseEmptyFields): useEmptyFields_Return {
    if (ReqiuredFields === undefined) {
        throw new Error("Required Fields are not provided in useEmptyFields Hook");
    }

    if (Object === undefined) {
        throw new Error("Object is not provided in useEmptyFields Hook");
    }

    const Empty_Fields: Array<string> = ReqiuredFields.filter((field: string) => {
        return !Object[field];
    })

    if (Empty_Fields.length > 0) {
        return {
            isMising: true,
            MissingFields: Empty_Fields,
            Length: Empty_Fields.length
        }
    } else {
        return {
            isMising: false,
            MissingFields: [],
            Length: 0
        }
    }
}

export {
    useEmptyFields
}

export type {
    IuseEmptyFields,
    useEmptyFields_Return
}