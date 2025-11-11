import {Form, Input, Select, SelectItem, Checkbox, Button} from "@heroui/react";
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
            <div className="flex flex-col gap-4 max-w-md p-8 rounded-2xl shadow-lg">
                <Input
                    isRequired
                    errorMessage={({validationDetails}) => {
                        if (validationDetails.valueMissing) {
                            return "";
                        }

                        return errors.name;
                    }}
                    label="Uživatelské jméno"
                    labelPlacement="inside"
                    name="username"
                    className=""
                />

                <Input
                    isRequired
                    errorMessage={({validationDetails}) => {
                        if (validationDetails.valueMissing) {
                            return "";
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
                          "data-[hover=true]:bg-white",
                          "data-[focus=true]:bg-white",
                      ],
                    }}
                />

                <Checkbox
                    classNames={{
                        label: "text-small",
                    }}
                    name="remember"
                    value="true"
                    isSelected={remember}
                    onValueChange={setRemember}
                >
                    Zapamatovat si mě
                </Checkbox>

                <div className="flex gap-4">
                    <Button className="w-full" color="primary" type="submit">
                        Submit
                    </Button>
                    <Button type="reset" variant="bordered">
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