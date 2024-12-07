import sys

import pandas as pd

want_labels = ["goal", "rank", "games", "type", "weight", "counter", "groups", "notes"]
required_labels = ["goal", "rank", "games"]


def filter_invalid(df: pd.DataFrame):
    df2 = df.copy()
    for index, row in df.iterrows():
        if pd.isna(row[required_labels]).any():
            df2.drop(index, inplace=True)
    df2 = df2[want_labels]
    return df2


def main():
    filter_invalid(pd.read_excel(sys.argv[1] if len(sys.argv) > 1 else "bingo.xlsx", sheet_name="任务")).to_csv("data.csv", index=False)


if __name__ == "__main__":
    main()
