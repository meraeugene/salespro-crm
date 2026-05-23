import { NextResponse } from "next/server";

const countries = [
  { code: "CM", name: "Cameroon", dialCode: "+237", flag: "CM" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "CA" },
  { code: "CV", name: "Cabo Verde", dialCode: "+238", flag: "CV" },
  { code: "KY", name: "Cayman Islands", dialCode: "+1-345", flag: "KY" },
  { code: "CF", name: "Central African Republic", dialCode: "+236", flag: "CF" },
  { code: "TD", name: "Chad", dialCode: "+235", flag: "TD" },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "CL" },
  { code: "CN", name: "China", dialCode: "+86", flag: "CN" },
  { code: "CX", name: "Christmas Island", dialCode: "+61", flag: "CX" },
  { code: "CC", name: "Cocos Islands", dialCode: "+61", flag: "CC" },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "CO" },
  { code: "KM", name: "Comoros", dialCode: "+269", flag: "KM" },
  { code: "CK", name: "Cook Islands", dialCode: "+682", flag: "CK" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "PH" },
  { code: "US", name: "United States", dialCode: "+1", flag: "US" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "GB" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "AU" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "SG" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "JP" },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "KR" },
  { code: "IN", name: "India", dialCode: "+91", flag: "IN" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "AE" },
];

export async function GET() {
  return NextResponse.json(countries);
}
