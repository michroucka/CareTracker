import {Form, Input, Checkbox, Button, Divider, addToast} from "@heroui/react";
import React from "react";
import { post } from "../api/api.js"
import {ServerStackIcon, XMarkIcon} from "@heroicons/react/24/solid"
import {useNavigate} from "react-router-dom";

function Login() {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [remember, setRemember] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const navigate = useNavigate();

    const onSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await post("/login", {
                username: username,
                password: password,
                "remember-me": remember ? "on" : ""
            });
            const result = await response.json();

            console.log(response.message);

            if (!response.ok) {
                addToast({
                    title: result.message,
                    color: "danger",
                    closeButton: true,
                    closeIcon: <XMarkIcon />,
                    timeout: 3000,
                    classNames: {
                        closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
                    },
                })

                setErrors({
                    username: "Neplatné přihlašovací údaje",
                    password: "Neplatné přihlašovací údaje"
                });
            } else {
                addToast({
                    title: `Vítejte ${username}!`,
                    color: "success",
                    closeButton: true,
                    closeIcon: <XMarkIcon/>,
                    timeout: 3000,
                    classNames: {
                        closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
                    },
                })

                navigate("/");
            }

        } catch {
            addToast({
                title: "Server není dostupný",
                color: "danger",
                closeButton: true,
                icon: <ServerStackIcon />,
                closeIcon: <XMarkIcon />,
                timeout: 5000,
                classNames: {
                    closeButton: "opacity-100 absolute right-4 top-1/2 -translate-y-1/2",
                },
            })
        }
    };

    return (
        <Form
            className="w-full justify-center items-center space-y-4"
            validationErrors={errors}
            onReset={() => {
                setUsername("");
                setPassword("");
                setRemember(false);
                setErrors({});
            }}
            onSubmit={onSubmit}
        >
            <div className="flex flex-col justify-center items-center gap-4 p-12 w-sm">
                <h1 className="cursor-pointer">Přihlášení</h1>
                <Divider className="mb-3 w-5/6" />
                <Input
                    required
                    errorMessage={({validationDetails}) => {
                        if (validationDetails.valueMissing) {
                            return "Prosím zadejte uživatelské jméno";
                        }

                        return errors.name;
                    }}
                    label="Uživatelské jméno"
                    labelPlacement="inside"
                    name="username"
                    value={username}
                    onValueChange={setUsername}
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
                    name="remember-me"
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
        </Form>
    );
}

export default Login;