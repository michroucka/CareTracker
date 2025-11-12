import {Form, Input, Checkbox, Button, Divider} from "@heroui/react";
import React from "react";

function Login() {
    const [password, setPassword] = React.useState("");
    const [remember, setRemember] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(null);
    const [errors, setErrors] = React.useState({});

    const onSubmit = (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));

        data.remember = remember;

        // Custom validation checks
        const newErrors = {};

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);

            return;
        }

        // Clear errors and submit
        setErrors({});
        setSubmitted(data);
    };

    return (
        <Form
            className="w-full justify-center items-center space-y-4"
            validationErrors={errors}
            onReset={() => setSubmitted(null)}
            onSubmit={onSubmit}
        >
            <div className="flex flex-col justify-center items-center gap-4 p-12 w-sm">
                <h1 className="cursor-pointer">Přihlášení</h1>
                <Divider className="mb-3 w-5/6" />
                <Input
                    required
                    errorMessage={({validationDetails}) => {
                        if (validationDetails.valueMissing) {
                            return "Prosím zadejte uživatelské jméno / email";
                        }

                        return errors.name;
                    }}
                    label="Uživatelské jméno"
                    labelPlacement="inside"
                    name="username"
                    classNames={{
                        inputWrapper: [
                            "bg-white",
                            "data-[hover=true]:bg-default-50",
                            "data-[focus=true]:bg-default-50",
                            "shadow-md"
                        ],
                        label: [
                            "text-medium"
                        ],
                        input: [
                            "text-medium",
                            "font-semibold"
                        ]
                    }}
                />

                <Input
                    required
                    errorMessage={({validationDetails}) => {
                        if (validationDetails.valueMissing) {
                            return "Prosím zadejte heslo";
                        }

                        return errors.name;
                    }}
                    label="Heslo"
                    labelPlacement="inside"
                    name="password"
                    type="password"
                    value={password}
                    onValueChange={setPassword}
                    classNames={{
                      inputWrapper: [
                          "bg-white",
                          "data-[hover=true]:bg-default-50",
                          "data-[focus=true]:bg-default-50",
                          "shadow-md"
                      ],
                      label: [
                          "text-medium"
                      ],
                        input: [
                            "text-medium",
                            "font-semibold"
                        ]
                    }}
                />

                <Checkbox
                    classNames={{
                        label: [
                            "text-medium"
                        ]
                    }}
                    className="self-start"
                    name="remember"
                    value="true"
                    isSelected={remember}
                    onValueChange={setRemember}
                >
                    Zapamatovat si mě
                </Checkbox>

                <div className="flex gap-4 w-full">
                    <Button className="w-full text-medium" color="primary" type="submit">
                        Submit
                    </Button>
                    <Button className="text-medium" type="reset" variant="bordered">
                        Reset
                    </Button>
                </div>
            </div>

            {submitted && (
                <div className="text-small text-default-500 mt-4">
                    Submitted data: <pre>{JSON.stringify(submitted, null, 2)}</pre>
                </div>
            )}
        </Form>
    );
}

export default Login;