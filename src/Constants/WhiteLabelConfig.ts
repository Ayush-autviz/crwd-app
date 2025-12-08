import { ImageSourcePropType } from "react-native";

export const WhiteLabelConfig = {
    AppName: "Autviz",
    AppLogo: require("../assets/logo/main.png") as ImageSourcePropType,
    BaseUrl: "http://ec2-65-0-54-143.ap-south-1.compute.amazonaws.com:8200",

    // Colors: {
    //     LightGrey: "#f6f6f6",
    //     PrimaryGrey: "#808080",
    //     SecondaryGrey: "#d3d3d3",
    //     PrimaryBlue: "#0047ff",
    //     SecondaryBlue: "rgb(239 246 255)",
    //     TertiaryBlue: "#c3d4f7",
    //     PrimaryGreen: "#008000",
    //     SecondaryGreen: "#e6f7e6",
    // },

    Colors: {
        LightGrey: "#F4F6FB",
        PrimaryGrey: "#2B2F3A",
        SecondaryGrey: "#9AA0AB",
        PrimaryBlue: "#3B1F9E",
        SecondaryBlue: "#F2ECFF",
        TertiaryBlue: "#C7B8FF",
        PrimaryGreen: "#FF7A59",
        SecondaryGreen: "#FFF2EE",
    },
};
