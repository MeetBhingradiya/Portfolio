interface IuseEmptyFields {
    Fields: Array<string>
    Request?: Request
    object?: any
    Type?: "Request" | "Object"
}

interface useEmptyFields_Return {
    isMising: boolean
    MissingFields: Array<string>
    Length: number
}

/**
 * check in object if the required fields are present in the request body or object
 */
function useEmptyFields({
    Fields,
    Request,
    object,
    Type
}: IuseEmptyFields): useEmptyFields_Return {

    var Filter_Object: Array<string> = {} as Array<string>;

    if (Type === undefined) Type = "Object";

    if (Type === "Request") {
        Filter_Object = Object.keys(Request?.body as any);
    } else if (Type === "Object") {
        Filter_Object = Object.keys(object);
    } else {
        throw new Error("Invalid Type of useEmptyFields Hook");
    }

    const Empty_Fields: Array<string> = Fields.filter((field: string) => {
        return !Filter_Object.includes(field);
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