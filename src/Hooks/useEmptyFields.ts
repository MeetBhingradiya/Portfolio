interface IuseEmptyFields {
    ReqiuredFields: Array<string>;
    targetObject: any;
}

interface useEmptyFields_Return {
    isMissing: boolean;
    MissingFields: Array<string>;
    Length: number;
}

/**
 * ? check in object if the required fields are present in the object.
 */
function useEmptyFields({
    ReqiuredFields,
    targetObject: inputObject
}: IuseEmptyFields): useEmptyFields_Return {
    if (ReqiuredFields === undefined) {
        throw new Error(
            "Required Fields are not provided in useEmptyFields Hook"
        );
    }

    if (inputObject === undefined || inputObject === null) {
        return {
            isMissing: true,
            MissingFields: ReqiuredFields,
            Length: ReqiuredFields.length
        };
    }

    let processedObject = inputObject;

    if (typeof inputObject === "string") {
        try {
            processedObject = JSON.parse(inputObject);
        } catch (error) {
            console.error(
                "Failed to parse string as JSON in useEmptyFields:",
                error
            );
            return {
                isMissing: true,
                MissingFields: ReqiuredFields,
                Length: ReqiuredFields.length
            };
        }
    }

    const Empty_Fields: Array<string> = ReqiuredFields.filter(
        (field: string) => {
            return (
                !(field in processedObject) ||
                processedObject[field] === undefined ||
                processedObject[field] === null
            );
        }
    );

    if (Empty_Fields.length > 0) {
        return {
            isMissing: true,
            MissingFields: Empty_Fields,
            Length: Empty_Fields.length
        };
    } else {
        return {
            isMissing: false,
            MissingFields: [],
            Length: 0
        };
    }
}

export { useEmptyFields };

export type { IuseEmptyFields, useEmptyFields_Return };
